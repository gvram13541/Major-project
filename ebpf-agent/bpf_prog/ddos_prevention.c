#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

#define DOS_THRESHOLD 1000  // Max packets per second from one IP

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __u32);
    __type(value, __u64);
} ddos_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __u32);  // Source IP
    __type(value, __u64); // Block status (1 = blocked)
} firewall_map SEC(".maps");

SEC("xdp")
int ddos_prevention(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != __bpf_htons(ETH_P_IP)) return XDP_PASS;

    struct iphdr *ip = data + sizeof(*eth);
    if ((void *)(ip + 1) > data_end) return XDP_PASS;

    __u32 src_ip = __bpf_ntohl(ip->saddr); // Convert to host order

    // Check if IP is already blocked
    u64 *blocked = bpf_map_lookup_elem(&firewall_map, &src_ip);
    if (blocked) return XDP_DROP; // Drop if blocked

    // Get packet count
    u64 *packet_count = bpf_map_lookup_elem(&ddos_map, &src_ip);
    if (!packet_count) {
        u64 initial_value = 1;
        bpf_map_update_elem(&ddos_map, &src_ip, &initial_value, BPF_ANY);
    } else {
        u64 new_count = *packet_count + 1;
        bpf_map_update_elem(&ddos_map, &src_ip, &new_count, BPF_ANY);

        if (new_count > DOS_THRESHOLD) {
            u64 block = 1;
            bpf_map_update_elem(&firewall_map, &src_ip, &block, BPF_ANY);
            bpf_printk("DDoS detected: Blocking IP %u.%u.%u.%u\n",
                (src_ip >> 24) & 0xFF, (src_ip >> 16) & 0xFF,
                (src_ip >> 8) & 0xFF, src_ip & 0xFF);
            return XDP_DROP;
        }
    }

    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";

