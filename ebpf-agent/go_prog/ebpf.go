package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/gorilla/websocket"
)

const (
	progPath = "ebpf.o"
	port     = "8080"
	wsRoute  = "/ws"
)

var (
	upgrader  = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	wsClients = make(map[*websocket.Conn]bool)
	wsMutex   sync.Mutex
)

type EbpfObjects struct {
	Program            *ebpf.Program
	HTTPReqMap         *ebpf.Map
	OutboundTrafficMap *ebpf.Map
	BandwidthMap       *ebpf.Map
	FirewallMap        *ebpf.Map
	DNSQueryMap        *ebpf.Map
	LatencyMap         *ebpf.Map
	JitterMap          *ebpf.Map
}

func main() {
	interfaceName, err := getFirstActiveInterface()
	if err != nil {
		log.Fatalf("Failed to find active interface: %v", err)
	}
	fmt.Printf("Using interface: %s\n", interfaceName)

	spec, err := ebpf.LoadCollectionSpec(progPath)
	if err != nil {
		log.Fatalf("Failed to load eBPF program: %v", err)
	}

	coll, err := ebpf.NewCollection(spec)
	if err != nil {
		log.Fatalf("Failed to load eBPF collection: %v", err)
	}
	defer coll.Close()

	objs := EbpfObjects{
		Program:            coll.Programs["xdp_monitor"],
		HTTPReqMap:         coll.Maps["http_req_map"],
		OutboundTrafficMap: coll.Maps["outbound_traffic_map"],
		BandwidthMap:       coll.Maps["bandwidth_map"],
		FirewallMap:        coll.Maps["firewall_map"],
		DNSQueryMap:        coll.Maps["dns_query_map"],
		LatencyMap:         coll.Maps["latency_map"],
		JitterMap:          coll.Maps["jitter_map"],
	}

	iface, err := net.InterfaceByName(interfaceName)
	if err != nil {
		log.Fatalf("Failed to get interface %s: %v", interfaceName, err)
	}

	xdpLink, err := link.AttachXDP(link.XDPOptions{
		Program:   objs.Program,
		Interface: iface.Index,
	})
	if err != nil {
		log.Fatalf("Failed to attach XDP program: %v", err)
	}
	defer xdpLink.Close()

	fmt.Printf("✅ XDP Program 'xdp_monitor' loaded and attached to %s\n", interfaceName)

	go startWebSocketServer()
	go streamMetrics(objs)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	fmt.Println("Detaching XDP Program...")
}

func getFirstActiveInterface() (string, error) {
	ifs, err := net.Interfaces()
	if err != nil {
		return "", err
	}

	for _, iface := range ifs {
		if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagLoopback == 0 {
			return iface.Name, nil
		}
	}
	return "", fmt.Errorf("no active network interface found")
}

func startWebSocketServer() {
	http.HandleFunc(wsRoute, handleWebSocket)
	log.Printf("WebSocket server started on ws://localhost:%s%s", port, wsRoute)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("WebSocket server failed: %v", err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	wsMutex.Lock()
	wsClients[conn] = true
	wsMutex.Unlock()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			wsMutex.Lock()
			delete(wsClients, conn)
			wsMutex.Unlock()
			return
		}
	}
}

func streamMetrics(objs EbpfObjects) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		metrics := map[string]map[string]uint64{
			"HTTP Requests":     readMap(objs.HTTPReqMap),
			"Outbound Traffic":  readMap(objs.OutboundTrafficMap),
			"Bandwidth Usage":   readMap(objs.BandwidthMap),
			"Firewall Rules":    readMap(objs.FirewallMap),
			"DNS Queries":       readMap(objs.DNSQueryMap),
			"Latency":           readMap(objs.LatencyMap),
			"Jitter":            readMap(objs.JitterMap),
		}

		formattedData, err := json.MarshalIndent(metrics, "", "  ")
		if err != nil {
			log.Printf("❌ Error formatting metrics: %v", err)
			continue
		}

		log.Println("\n📊 Metrics Data Sent:\n" + string(formattedData))
		broadcastMetrics(formattedData)
	}
}

func readMap(m *ebpf.Map) map[string]uint64 {
	result := make(map[string]uint64)
	iter := m.Iterate()
	var key uint32
	var value uint64

	for iter.Next(&key, &value) {
		result[fmt.Sprintf("%d", key)] = value
	}
	return result
}

func broadcastMetrics(data []byte) {
	wsMutex.Lock()
	defer wsMutex.Unlock()
	for client := range wsClients {
		if err := client.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("Failed to send message: %v", err)
			client.Close()
			delete(wsClients, client)
		}
	}
}

