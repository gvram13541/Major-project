package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

const (
	progPath = "ebpf.o"
	port     = "8080"
	wsRoute  = "/ws"
)

var (
	upgrader  = websocket.Upgrader{}
	wsClients = make(map[*websocket.Conn]bool) // Track WebSocket clients
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Set host from .env or default to 0.0.0.0
	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	// Get the first active network interface dynamically
	interfaceName, err := getFirstActiveInterface()
	if err != nil {
		log.Fatalf("Failed to find active interface: %v", err)
	}
	fmt.Printf("Using interface: %s\n", interfaceName)

	// Open eBPF object file
	spec, err := ebpf.LoadCollectionSpec(progPath)
	if err != nil {
		log.Fatalf("Failed to load eBPF program: %v", err)
	}

	// Load eBPF objects
	objs := struct {
		Program              *ebpf.Program `ebpf:"xdp_monitor"`
		HTTPReqMap           *ebpf.Map     `ebpf:"http_req_map"`
		OutboundTrafficMap   *ebpf.Map     `ebpf:"outbound_traffic_map"`
		LatencyMap           *ebpf.Map     `ebpf:"latency_map"`
		DDOSMap              *ebpf.Map     `ebpf:"ddos_map"`
		FirewallMap          *ebpf.Map     `ebpf:"firewall_map"`
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

	fmt.Printf("✅ XDP Program 'xdp_monitor' loaded and attached to %s\n", interfaceName)

	// Start WebSocket server
	go startWebSocketServer(host)

	// Start sending metrics to WebSocket clients
	go streamMetrics(objs.HTTPReqMap, objs.OutboundTrafficMap, objs.LatencyMap, objs.DDOSMap, objs.FirewallMap)

	// Listen for termination signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	fmt.Println("Detaching XDP Program...")
}

// **Get First Active Network Interface**
func getFirstActiveInterface() (string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "", err
	}

	for _, iface := range interfaces {
		// Ignore loopback and down interfaces
		if iface.Flags&net.FlagLoopback == 0 && iface.Flags&net.FlagUp != 0 {
			addrs, _ := iface.Addrs()
			for _, addr := range addrs {
				if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() && ipNet.IP.To4() != nil {
					return iface.Name, nil
				}
			}
		}
	}
	return "", fmt.Errorf("no active network interface found")
}

// **Start WebSocket Server**
func startWebSocketServer(host string) {
	serverAddr := fmt.Sprintf("%s:%s", host, port) // Use dynamically set domain and port
	http.HandleFunc(wsRoute, handleWebSocket)
	log.Printf("🚀 WebSocket server started on ws://%s%s\n", serverAddr, wsRoute)
	log.Fatal(http.ListenAndServe(serverAddr, nil))
}

// **Handle WebSocket Connections**
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade WebSocket:", err)
		return
	}
	wsClients[conn] = true
	log.Println("New WebSocket client connected.")

	defer func() {
		conn.Close()
		delete(wsClients, conn)
		log.Println("WebSocket client disconnected.")
	}()

	// Keep connection alive
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

// **Stream Metrics to WebSockets**
func streamMetrics(httpMap, exfilMap, latencyMap, ddosMap, firewallMap *ebpf.Map) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		metrics := map[string]map[string]uint64{
			"HTTP Requests":         readMap(httpMap),
			"Data Exfiltration":     readMap(exfilMap),
			"Latency":               readMap(latencyMap),
			"DDoS Attack Detection": readMap(ddosMap),
			"Firewall Blocked IPs":  readMap(firewallMap),
		}

		// Send formatted metrics to WebSocket clients
		broadcastMetrics(metrics)
	}
}

// **Read eBPF Map Data**
func readMap(m *ebpf.Map) map[string]uint64 {
	data := make(map[string]uint64)
	iter := m.Iterate()
	var key uint32
	var value uint64

	for iter.Next(&key, &value) {
		ip := intToIP(key)
		data[ip] = value
	}
	return data
}

// **Convert uint32 IP to String**
func intToIP(ip uint32) string {
	return fmt.Sprintf("%d.%d.%d.%d",
		byte(ip>>24), byte(ip>>16), byte(ip>>8), byte(ip))
}

// **Send Data to WebSocket Clients (Formatted)**
func broadcastMetrics(metrics map[string]map[string]uint64) {
	// Format the metrics as indented JSON for better readability
	formattedMetrics, err := json.MarshalIndent(metrics, "", "    ")
	if err != nil {
		log.Println("Error formatting metrics:", err)
		return
	}

	for client := range wsClients {
		if err := client.WriteMessage(websocket.TextMessage, formattedMetrics); err != nil {
			log.Println("Error sending metrics:", err)
			client.Close()
			delete(wsClients, client)
		}
	}
}

