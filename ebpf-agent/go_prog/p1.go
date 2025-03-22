package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
)

const (
	interfaceName = "ens33" // Change this to your network interface
	progPath      = "network_monitor.o"
)

func main() {
	// Open eBPF object file
	spec, err := ebpf.LoadCollectionSpec(progPath)
	if err != nil {
		log.Fatalf("Failed to load eBPF program: %v", err)
	}

	// Load eBPF objects
	objs := struct {
		Program *ebpf.Program `ebpf:"network_monitor"`
	}{}

	if err := spec.LoadAndAssign(&objs, nil); err != nil {
		log.Fatalf("Failed to load and assign eBPF objects: %v", err)
	}
	defer objs.Program.Close()

	// Get the network interface index
	iface, err := net.InterfaceByName(interfaceName)
	if err != nil {
		log.Fatalf("Failed to get interface %s: %v", interfaceName, err)
	}

	// Attach XDP program to the interface
	xdpLink, err := link.AttachXDP(link.XDPOptions{
		Program:   objs.Program,
		Interface: iface.Index,
	})
	if err != nil {
		log.Fatalf("Failed to attach XDP program: %v", err)
	}
	defer xdpLink.Close()

	fmt.Printf("XDP Program loaded and attached to %s\n", interfaceName)

	// Listen for termination signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	fmt.Println("Detaching XDP Program...")
}


