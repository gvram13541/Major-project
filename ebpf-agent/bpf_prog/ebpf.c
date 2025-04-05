#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

#define DATA_EXFIL_THRESHOLD 10

// -------------------- Maps --------------------
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 2048);
    __type(key, __be32);
    __type(value, __u64);
} http_req_map SEC(".maps"), outbound_traffic_map SEC(".maps"), latency_map SEC(".maps"),
  rtt_map SEC(".maps"), jitter_map SEC(".maps"), bandwidth_map SEC(".maps"),
  firewall_map SEC(".maps"), dns_query_map SEC(".maps"), last_seen_map SEC(".maps"),
  top_talkers_map SEC(".maps"), protocol_traffic_map SEC(".maps"), dropped_packet_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __type(key, __u32);     // destination IP
    __type(value, __u64);   // state transition counter
    __uint(max_entries, 1024);
} tcp_state_map SEC(".maps");

// -------------------- XDP Program --------------------
SEC("xdp")
int xdp_monitor(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != __bpf_htons(ETH_P_IP)) return XDP_PASS;

    struct iphdr *ip = (struct iphdr *)(eth + 1);
    if ((void *)(ip + 1) > data_end) return XDP_PASS;

    __be32 src_ip = ip->saddr;
    __u64 pkt_size = data_end - data;
    __u64 one = 1;
    __u64 now = bpf_ktime_get_ns();

    // -------------------- Bandwidth Usage --------------------
    __u64 *total_bytes = bpf_map_lookup_elem(&bandwidth_map, &src_ip);
    total_bytes ? __sync_fetch_and_add(total_bytes, pkt_size) :
                  bpf_map_update_elem(&bandwidth_map, &src_ip, &pkt_size, BPF_ANY);

    // -------------------- Outbound Traffic + Exfil --------------------
    __u64 *count = bpf_map_lookup_elem(&outbound_traffic_map, &src_ip);
    if (count) {
        if (*count >= DATA_EXFIL_THRESHOLD) {
            bpf_map_update_elem(&firewall_map, &src_ip, &one, BPF_ANY);

            // ✅ Increment dropped packet counter
            __u64 *drop = bpf_map_lookup_elem(&dropped_packet_map, &src_ip);
            drop ? __sync_fetch_and_add(drop, 1) :
                   bpf_map_update_elem(&dropped_packet_map, &src_ip, &one, BPF_ANY);

            return XDP_DROP;
        }

        __sync_fetch_and_add(count, 1);
    } else {
        bpf_map_update_elem(&outbound_traffic_map, &src_ip, &one, BPF_ANY);
    }

    // -------------------- Latency & Jitter --------------------
    __u64 *last_ts = bpf_map_lookup_elem(&last_seen_map, &src_ip);
    if (last_ts) {
        __u64 latency = now - *last_ts;
        bpf_map_update_elem(&latency_map, &src_ip, &latency, BPF_ANY);

        __u64 *prev = bpf_map_lookup_elem(&jitter_map, &src_ip);
        if (prev) {
            __u64 jitter = latency > *prev ? latency - *prev : *prev - latency;
            bpf_map_update_elem(&jitter_map, &src_ip, &jitter, BPF_ANY);
        }
        bpf_map_update_elem(&jitter_map, &src_ip, &latency, BPF_ANY);
    }
    bpf_map_update_elem(&last_seen_map, &src_ip, &now, BPF_ANY);

    // -------------------- HTTP Tracking --------------------
    if (ip->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp = (struct tcphdr *)((void *)ip + ip->ihl * 4);
        if ((void *)(tcp + 1) > data_end) return XDP_PASS;

        __u16 dport = __bpf_ntohs(tcp->dest);
        if (dport == 80 || dport == 443) {
            __u64 *h = bpf_map_lookup_elem(&http_req_map, &src_ip);
            h ? __sync_fetch_and_add(h, 1) :
                bpf_map_update_elem(&http_req_map, &src_ip, &one, BPF_ANY);
        }
    }

    // -------------------- DNS Queries --------------------
    if (ip->protocol == IPPROTO_UDP) {
        struct udphdr *udp = (struct udphdr *)((void *)ip + ip->ihl * 4);
        if ((void *)(udp + 1) > data_end) return XDP_PASS;

        if (__bpf_ntohs(udp->dest) == 53) {
            __u64 *d = bpf_map_lookup_elem(&dns_query_map, &src_ip);
            d ? __sync_fetch_and_add(d, 1) :
                bpf_map_update_elem(&dns_query_map, &src_ip, &one, BPF_ANY);
        }
    }

    // -------------------- Top Talkers --------------------
    __u64 *talk = bpf_map_lookup_elem(&top_talkers_map, &src_ip);
    talk ? __sync_fetch_and_add(talk, pkt_size) :
           bpf_map_update_elem(&top_talkers_map, &src_ip, &pkt_size, BPF_ANY);

    // -------------------- Protocol Traffic --------------------
    __u32 proto = ip->protocol;
    __u64 *pp = bpf_map_lookup_elem(&protocol_traffic_map, &proto);
    pp ? __sync_fetch_and_add(pp, pkt_size) :
         bpf_map_update_elem(&protocol_traffic_map, &proto, &pkt_size, BPF_ANY);

    return XDP_PASS;
}

// -------------------- TCP State Tracing (replaced with kprobe) --------------------
SEC("kprobe/tcp_set_state")
int trace_tcp_state(struct pt_regs *ctx) {
    struct sock *sk = (struct sock *)ctx->di;
    if (!sk) return 0;

    struct sock_common common = {};
    bpf_probe_read_kernel(&common, sizeof(common), &sk->__sk_common);
    __u32 dst_ip = common.skc_daddr;

    __u64 one = 1;
    __u64 *counter = bpf_map_lookup_elem(&tcp_state_map, &dst_ip);
    if (counter) {
        (*counter)++;
    } else {
        bpf_map_update_elem(&tcp_state_map, &dst_ip, &one, BPF_ANY);
    }

    return 0;
}

// -------------------- Process Execution Logging --------------------
SEC("tracepoint/syscalls/sys_enter_execve")
int log_execve(struct trace_event_raw_sys_enter *ctx) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));
    bpf_printk("Process executed: %s", comm);
    return 0;
}

char _license[] SEC("license") = "GPL";

