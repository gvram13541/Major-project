#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

// Map for packet size statistics (min and max)
struct bpf_map_def SEC("maps") packet_stats_map = {
    .type = BPF_MAP_TYPE_ARRAY,
    .key_size = sizeof(__u32),
    .value_size = sizeof(__u64),
    .max_entries = 2, // Index 0: min, Index 1: max
};

// Map for protocol counts
struct bpf_map_def SEC("maps") protocol_count_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(__u8),
    .value_size = sizeof(__u64),
    .max_entries = 256, // Protocol types
};

// Map for source-destination IP pairs with ports
struct ip_pair_with_ports {
    __be32 src_ip;
    __be32 dest_ip;
    __be16 src_port;
    __be16 dest_port;
};
struct bpf_map_def SEC("maps") ip_traffic_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(struct ip_pair_with_ports),
    .value_size = sizeof(__u64),
    .max_entries = 1024, // Active IP pairs
};

// Map for tracking the number of packets per source IP (for DoS detection)
struct bpf_map_def SEC("maps") ip_packet_count_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(__be32), // Source IP address
    .value_size = sizeof(u64),  // Packet count
    .max_entries = 1024,        // Maximum number of IPs to track
};

// Map for detecting potential DDoS by IP
struct bpf_map_def SEC("maps") ddos_alert_map = {
    .type = BPF_MAP_TYPE_HASH,
    .key_size = sizeof(__be32), // Source IP address
    .value_size = sizeof(u64),  // Packet count threshold exceeded flag (1 = alert)
    .max_entries = 1024,        // Maximum number of IPs to track
};

// Define threshold for DoS/DDoS detection
#define DOS_THRESHOLD 1000 // Maximum allowed packets per second from a single IP
#define PORT_THRESHOLD 500 // Maximum allowed packets per port

// XDP program for network monitoring and DDoS detection
SEC("xdp")
int network_monitor(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    // Ethernet header
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_DROP;

    // Only process IPv4 packets
    if (eth->h_proto != __bpf_htons(ETH_P_IP))
        return XDP_PASS;

    // IP header
    struct iphdr *ip = data + sizeof(*eth);
    if ((void *)(ip + 1) > data_end)
        return XDP_PASS;

    // Packet size monitoring
    u32 key_min = 0, key_max = 1;
    u64 pkt_size = (u64)(data_end - data);  // Explicit casting to u64
    u64 *min_size = bpf_map_lookup_elem(&packet_stats_map, &key_min);
    u64 *max_size = bpf_map_lookup_elem(&packet_stats_map, &key_max);

    if (min_size && max_size) {
        // Update min and max packet size
        if (*min_size == 0 || pkt_size < *min_size)
            bpf_map_update_elem(&packet_stats_map, &key_min, &pkt_size, BPF_ANY);
        if (pkt_size > *max_size)
            bpf_map_update_elem(&packet_stats_map, &key_max, &pkt_size, BPF_ANY);
    }

    // Protocol monitoring
    u8 protocol = ip->protocol;
    u64 *protocol_count = bpf_map_lookup_elem(&protocol_count_map, &protocol);
    if (protocol_count) {
        __sync_fetch_and_add(protocol_count, 1);  // Atomic increment
    } else {
        u64 initial = 1;
        bpf_map_update_elem(&protocol_count_map, &protocol, &initial, BPF_ANY);
    }

    // Handle TCP/UDP packets to extract ports
    if (protocol == IPPROTO_TCP || protocol == IPPROTO_UDP) {
        struct tcphdr *tcp = data + sizeof(*eth) + sizeof(*ip);
        if ((void *)(tcp + 1) > data_end)
            return XDP_PASS;

        // Define the source and destination ports
        __be16 src_port = tcp->source;
        __be16 dest_port = tcp->dest;

        // Source and destination IP and ports monitoring
        struct ip_pair_with_ports pair = {
            .src_ip = ip->saddr,
            .dest_ip = ip->daddr,
            .src_port = src_port,
            .dest_port = dest_port,
        };
        u64 *traffic_count = bpf_map_lookup_elem(&ip_traffic_map, &pair);
        if (traffic_count) {
            __sync_fetch_and_add(traffic_count, 1);  // Atomic increment
        } else {
            u64 initial = 1;
            bpf_map_update_elem(&ip_traffic_map, &pair, &initial, BPF_ANY);
        }

        // Track packets per source IP for DoS detection
        u64 *packet_count = bpf_map_lookup_elem(&ip_packet_count_map, &ip->saddr);
        if (packet_count) {
            // Increment packet count for this IP
            __sync_fetch_and_add(packet_count, 1);
        } else {
            u64 initial = 1;
            bpf_map_update_elem(&ip_packet_count_map, &ip->saddr, &initial, BPF_ANY);
        }

        // Check for potential DDoS on specific source IPs
        u64 *ddos_alert = bpf_map_lookup_elem(&ddos_alert_map, &ip->saddr);
        if (packet_count && *packet_count > DOS_THRESHOLD) {
            // Trigger DDoS alert if packet count exceeds threshold
            if (!ddos_alert) {
                u64 alert_flag = 1;
                bpf_map_update_elem(&ddos_alert_map, &ip->saddr, &alert_flag, BPF_ANY);
                bpf_printk("DDoS Attack Detected from IP: %x\n", ip->saddr); // Log DDoS alert
            }
        }

        // Check for port flood (DDoS attack targeting a specific port)
        if (traffic_count && *traffic_count > PORT_THRESHOLD) {
            // Trigger alert for port flooding (potential DDoS attack)
            bpf_printk("Port Flooding Attack Detected on Port: %d, Src IP: %x\n", dest_port, ip->saddr);
        }
    }

    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";

