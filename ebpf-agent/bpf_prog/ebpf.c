#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

#define DOS_THRESHOLD 1000  // Max packets per second from one IP
#define DATA_EXFIL_THRESHOLD 500 // Max packets before blocking

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __be32);
    __type(value, __u64);
} http_req_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __be32);
    __type(value, __u64);
} outbound_traffic_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __be32);
    __type(value, __u64);
} latency_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __u32);
    __type(value, __u64);
} ddos_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __u32);
    __type(value, __u64);
} firewall_map SEC(".maps");

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
    __be32 dest_ip = ip->daddr;

    // **1. Monitor HTTP Traffic**
    struct tcphdr *tcp = (struct tcphdr *)(ip + 1);
    if ((void *)(tcp + 1) > data_end) return XDP_PASS;

    if (__bpf_ntohs(tcp->dest) == 80 || __bpf_ntohs(tcp->dest) == 443) {
        u64 *count = bpf_map_lookup_elem(&http_req_map, &src_ip);
        u64 one = 1;
        if (!count) {
            bpf_map_update_elem(&http_req_map, &src_ip, &one, BPF_ANY);
        } else {
            __sync_fetch_and_add(count, 1);
        }
        bpf_printk("HTTP request detected from: %x", src_ip);
    }

    // **2. Detect Data Exfiltration**
    if (dest_ip == __bpf_htonl(0xC0A80001)) {
        u64 zero = 0, *count;
        count = bpf_map_lookup_elem(&outbound_traffic_map, &src_ip);
        if (!count) {
            bpf_map_update_elem(&outbound_traffic_map, &src_ip, &zero, BPF_ANY);
            count = bpf_map_lookup_elem(&outbound_traffic_map, &src_ip);
            if (!count) return XDP_PASS;
        }
        if (*count > DATA_EXFIL_THRESHOLD) {
            bpf_printk("Data exfiltration detected from %pI4 to %pI4\n", &src_ip, &dest_ip);
            return XDP_DROP;
        }
        __sync_fetch_and_add(count, 1);
    }

    // **3. Track Latency**
    u64 now = bpf_ktime_get_ns();
    u64 *prev_time = bpf_map_lookup_elem(&latency_map, &src_ip);
    if (prev_time) {
        u64 latency = now - *prev_time;
        bpf_map_update_elem(&latency_map, &src_ip, &latency, BPF_ANY);
    } else {
        bpf_map_update_elem(&latency_map, &src_ip, &now, BPF_ANY);
    }

    // **4. DDoS Prevention**
    __u32 host_src_ip = __bpf_ntohl(src_ip);
    u64 *blocked = bpf_map_lookup_elem(&firewall_map, &host_src_ip);
    if (blocked) return XDP_DROP;

    u64 *packet_count = bpf_map_lookup_elem(&ddos_map, &host_src_ip);
    if (!packet_count) {
        u64 initial_value = 1;
        bpf_map_update_elem(&ddos_map, &host_src_ip, &initial_value, BPF_ANY);
    } else {
        u64 new_count = *packet_count + 1;
        bpf_map_update_elem(&ddos_map, &host_src_ip, &new_count, BPF_ANY);
        if (new_count > DOS_THRESHOLD) {
            u64 block = 1;
            bpf_map_update_elem(&firewall_map, &host_src_ip, &block, BPF_ANY);
            bpf_printk("DDoS detected: Blocking IP %u.%u.%u.%u\n",
                (host_src_ip >> 24) & 0xFF, (host_src_ip >> 16) & 0xFF,
                (host_src_ip >> 8) & 0xFF, host_src_ip & 0xFF);
            return XDP_DROP;
        }
    }

    return XDP_PASS;
}

// **5. Log Process Executions**
SEC("tracepoint/syscalls/sys_enter_execve")
int log_execve(struct trace_event_raw_sys_enter *ctx) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));
    bpf_printk("Process executed: %s", comm);
    return 0;
}

char _license[] SEC("license") = "GPL";

