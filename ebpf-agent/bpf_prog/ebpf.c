#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

#define DOS_THRESHOLD 1000       // Max packets per second per IP
#define DATA_EXFIL_THRESHOLD 500 // Max outbound packets before blocking

// **eBPF Maps**
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 2048);
    __type(key, __be32);
    __type(value, __u64);
} http_req_map SEC(".maps"), outbound_traffic_map SEC(".maps"), latency_map SEC(".maps"),
  rtt_map SEC(".maps"), jitter_map SEC(".maps"), bandwidth_map SEC(".maps"),
  firewall_map SEC(".maps"), dns_query_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 2048);
    __type(key, __be32);
    __type(value, __u64);
} last_seen_map SEC(".maps");

// **Packet Monitoring (XDP)**
SEC("xdp")
int xdp_monitor(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != __bpf_htons(ETH_P_IP)) return XDP_PASS;
    
    struct iphdr *ip = (struct iphdr *)(eth + 1);
    if ((void *)(ip + 1) > data_end) return XDP_PASS;

    __be32 src_ip = ip->saddr, dest_ip = ip->daddr;
    __u64 pkt_size = data_end - data;
    __u64 one = 1;
    __u64 ts_now = bpf_ktime_get_ns();

    // **1. Track Bandwidth Usage**
    __u64 *total_bytes = bpf_map_lookup_elem(&bandwidth_map, &src_ip);
    if (total_bytes) {
        __sync_fetch_and_add(total_bytes, pkt_size);
    } else {
        bpf_map_update_elem(&bandwidth_map, &src_ip, &pkt_size, BPF_ANY);
    }

    // **2. Monitor HTTP Requests (TCP Port 80/443)**
    if (ip->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp = (struct tcphdr *)((void *)ip + (ip->ihl * 4));
        if ((void *)(tcp + 1) > data_end) return XDP_PASS;

        __u16 dest_port = __bpf_ntohs(tcp->dest);
        if (dest_port == 80 || dest_port == 443) { // HTTP or HTTPS
            __u64 *count = bpf_map_lookup_elem(&http_req_map, &src_ip);
            if (count) {
                __sync_fetch_and_add(count, 1);
            } else {
                bpf_map_update_elem(&http_req_map, &src_ip, &one, BPF_ANY);
            }
        }
    }

    // **3. Detect Data Exfiltration**
    __u64 *count = bpf_map_lookup_elem(&outbound_traffic_map, &src_ip);
    if (count) {
        if (*count >= DATA_EXFIL_THRESHOLD) {
            bpf_map_update_elem(&firewall_map, &src_ip, &one, BPF_ANY);
            return XDP_DROP;
        }
        __sync_fetch_and_add(count, 1);
    } else {
        bpf_map_update_elem(&outbound_traffic_map, &src_ip, &one, BPF_ANY);
    }

    // **4. Track Latency, RTT, and Jitter**
    __u64 *last_ts = bpf_map_lookup_elem(&last_seen_map, &src_ip);
    if (last_ts) {
        __u64 latency = ts_now - *last_ts;
        bpf_map_update_elem(&latency_map, &src_ip, &latency, BPF_ANY);

        __u64 *prev_latency = bpf_map_lookup_elem(&jitter_map, &src_ip);
        if (prev_latency) {
            __u64 jitter = latency > *prev_latency ? latency - *prev_latency : *prev_latency - latency;
            bpf_map_update_elem(&jitter_map, &src_ip, &jitter, BPF_ANY);
        }
        bpf_map_update_elem(&jitter_map, &src_ip, &latency, BPF_ANY);
    }
    bpf_map_update_elem(&last_seen_map, &src_ip, &ts_now, BPF_ANY);

    // **5. Monitor DNS Queries (UDP Port 53)**
    if (ip->protocol == IPPROTO_UDP) {
        struct udphdr *udp = (struct udphdr *)((void *)ip + (ip->ihl * 4));
        if ((void *)(udp + 1) > data_end) return XDP_PASS;

        if (__bpf_ntohs(udp->dest) == 53) {
            __u64 *dns_count = bpf_map_lookup_elem(&dns_query_map, &src_ip);
            if (dns_count) {
                __sync_fetch_and_add(dns_count, 1);
            } else {
                bpf_map_update_elem(&dns_query_map, &src_ip, &one, BPF_ANY);
            }
        }
    }

    return XDP_PASS;
}

// **Process Execution Logging (Syscall Trace)**
SEC("tracepoint/syscalls/sys_enter_execve")
int log_execve(struct trace_event_raw_sys_enter *ctx) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));
    bpf_printk("Process executed: %s", comm);
    return 0;
}

char _license[] SEC("license") = "GPL";

