#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __be32);  // Source IP
    __type(value, __u64); // Last timestamp
} latency_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __be32);  // Source IP
    __type(value, __u64); // Dropped packet count
} drop_map SEC(".maps");

SEC("xdp")
int track_latency(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != __bpf_htons(ETH_P_IP)) return XDP_PASS;

    struct iphdr *ip = (struct iphdr *)(eth + 1);
    if ((void *)ip + sizeof(*ip) > data_end) return XDP_PASS;

    __be32 src_ip = ip->saddr;
    u64 now = bpf_ktime_get_ns(); // Capture current timestamp

    // Get previous timestamp
    u64 *prev_time = bpf_map_lookup_elem(&latency_map, &src_ip);
    if (prev_time) {
        u64 latency = now - *prev_time; // Calculate latency
        bpf_map_update_elem(&latency_map, &src_ip, &latency, BPF_ANY);
    } else {
        // First packet, store the timestamp
        bpf_map_update_elem(&latency_map, &src_ip, &now, BPF_ANY);
    }

    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";

