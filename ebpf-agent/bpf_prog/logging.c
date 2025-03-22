#include "headers/common.h"
#include "headers/bpf_endian.h"
#include "headers/bpf_helper_defs.h"
#include "headers/bpf_helpers.h"
#include "headers/bpf_tracing.h"
#include "headers/vmlinux.h"

SEC("tracepoint/syscalls/sys_enter_execve")
int log_execve(struct trace_event_raw_sys_enter *ctx) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));

    // Log process execution
    bpf_printk("Process executed: %s", comm);

    return 0;
}

char _license[] SEC("license") = "GPL";

