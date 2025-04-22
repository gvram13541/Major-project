#include <linux/ptrace.h>
#include <linux/sched.h>
#include <linux/inet.h>
#include <linux/uaccess.h>
#include <linux/unistd.h>
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/net.h>
#include <linux/socket.h>
#include <linux/tcp.h>

#define TASK_COMM_LEN 16

SEC("tracepoint/syscalls/sys_enter_connect")
int trace_connect(struct trace_event_raw_sys_enter *ctx)
{
    u32 pid = bpf_get_current_pid_tgid();
    char comm[TASK_COMM_LEN];
    bpf_get_current_comm(&comm, sizeof(comm));

    // Get the sockaddr_in structure for the destination address
    struct sockaddr_in *sa = (struct sockaddr_in *)PT_REGS_PARM1(ctx);
    
    if (sa) {
        u32 ip = sa->sin_addr.s_addr;
        u16 port = ntohs(sa->sin_port);
        
        // Output the process name, PID, and connection details
        bpf_trace_printk("Process: %s, PID: %d, Connecting to %d.%d.%d.%d:%d\n",
                          comm, pid,
                          (ip >> 24) & 0xFF, (ip >> 16) & 0xFF, 
                          (ip >> 8) & 0xFF, ip & 0xFF, port);
    }

    return 0;
}

char _license[] SEC("license") = "GPL";
