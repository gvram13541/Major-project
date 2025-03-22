#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, __be32);
    __type(value, __u64);
} outbound_traffic_map SEC(".maps");

SEC("xdp")
int detect_data_exfil(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != __bpf_htons(ETH_P_IP)) return XDP_PASS;

    struct iphdr *ip = data + sizeof(*eth);
    if ((void *)(ip + 1) > data_end) return XDP_PASS;

    __be32 src_ip = ip->saddr;
    __be32 dest_ip = ip->daddr;

    // Detect exfiltration to 192.168.0.1
    if (dest_ip == __bpf_htonl(0xC0A80001)) {
        u64 zero = 0, *count;
        count = bpf_map_lookup_elem(&outbound_traffic_map, &src_ip);
        if (!count) {
            bpf_map_update_elem(&outbound_traffic_map, &src_ip, &zero, BPF_ANY);
            count = bpf_map_lookup_elem(&outbound_traffic_map, &src_ip);
            if (!count) return XDP_PASS;
        }

        // If threshold is exceeded, drop packet
        if (*count > 500) {
            bpf_printk("Data exfiltration detected from %pI4 to %pI4\n", &src_ip, &dest_ip);
            return XDP_DROP;
        }

        __sync_fetch_and_add(count, 1);
    }

    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";

