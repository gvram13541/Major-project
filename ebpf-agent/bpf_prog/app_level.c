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
} http_req_map SEC(".maps");

SEC("xdp")
int monitor_http(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) return XDP_PASS;
    if (eth->h_proto != __bpf_htons(ETH_P_IP)) return XDP_PASS;

    struct iphdr *ip = data + sizeof(*eth);
    if ((void *)(ip + 1) > data_end) return XDP_PASS;
    if (ip->protocol != IPPROTO_TCP) return XDP_PASS;

    struct tcphdr *tcp = data + sizeof(*eth) + (ip->ihl * 4);
    if ((void *)(tcp + 1) > data_end) return XDP_PASS;

    if (__bpf_ntohs(tcp->dest) == 80 || __bpf_ntohs(tcp->dest) == 443) {
        __be32 src_ip = ip->saddr;
        u64 *count = bpf_map_lookup_elem(&http_req_map, &src_ip);
        u64 one = 1;

        if (!count) {
            bpf_map_update_elem(&http_req_map, &src_ip, &one, BPF_ANY);
        } else {
            __sync_fetch_and_add(count, 1);
        }

        bpf_printk("HTTP request detected from: %x", src_ip);
    }

    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";

