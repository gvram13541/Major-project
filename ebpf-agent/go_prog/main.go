package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/gorilla/websocket"
)

// WebSocket & HTTP server URLs
const (
	serverWS   = "ws://localhost:8080/ws"
	serverHTTP = "http://localhost:8080/update-metrics"
)

func main() {
	// Load eBPF programs
	files := map[string]string{
		"ddos_prevention":    "../bpf_prog/ddos_prevention.o",
		"anomaly_detection":  "../bpf_prog/anomaly_detection.o",
		"app_level":          "../bpf_prog/app_level.o",
		"network_performance": "../bpf_prog/network_performance.o",
		"logging":           "../bpf_prog/logging.o",
	}

	collections := make(map[string]*ebpf.Collection)
	for key, path := range files {
		spec, err := ebpf.LoadCollectionSpec(path)
		if err != nil {
			log.Fatalf("Failed to load eBPF program %s: %v", key, err)
		}

		coll, err := ebpf.NewCollection(spec)
		if err != nil {
			log.Fatalf("Failed to create eBPF collection for %s: %v", key, err)
		}
		collections[key] = coll
	}
	defer func() {
		for _, coll := range collections {
			coll.Close()
		}
	}()

	// Attach network-related eBPF programs to the network interface
	iface, err := net.InterfaceByName("ens33") // Change to your interface
	if err != nil {
		log.Fatalf("Failed to get network interface 'ens33': %v", err)
	}

	networkPrograms := []string{"ddos_prevention", "network_performance", "app_level", "logging"}
	for _, progName := range networkPrograms {
		if prog := collections[progName].Programs[progName]; prog != nil {
			xdpLink, err := link.AttachXDP(link.XDPOptions{
				Program:   prog,
				Interface: iface.Index,
			})
			if err != nil {
				log.Fatalf("Failed to attach XDP program %s: %v", progName, err)
			}
			defer xdpLink.Close()
			log.Printf("Successfully attached %s to interface %s\n", progName, iface.Name)
		}
	}

	// Attach tracepoints for logging and anomaly detection
	attachTracepoint(collections, "logging", "syscalls", "sys_enter_execve")
	attachTracepoint(collections, "anomaly_detection", "syscalls", "sys_enter_open")

	// Initialize maps
	monitorMaps := map[string]*ebpf.Map{
		"anomaly":         collections["anomaly_detection"].Maps["outbound_traffic_map"],
		"ddos":            collections["ddos_prevention"].Maps["ddos_map"],
		"latency":         collections["network_performance"].Maps["latency_map"],
		"dropped_packets": collections["network_performance"].Maps["drop_map"],
		"app_metrics":     collections["app_level"].Maps["http_req_map"],
	}

	// Start WebSocket listener for real-time alerts
	go listenForAlerts()

	// Polling loop for metrics
	for {
		fmt.Println("\n--- Collecting Metrics ---")

		metrics := map[string]interface{}{
			"ddos":            checkDDoS(monitorMaps["ddos"]),
			"anomalies":       checkAnomalies(monitorMaps["anomaly"]),
			"network_latency": checkNetworkPerformance(monitorMaps["latency"]),
			"dropped_packets": checkDroppedPackets(monitorMaps["dropped_packets"]),
			"app_metrics":     checkAppMetrics(monitorMaps["app_metrics"]),
		}

		// Send metrics to server
		sendMetrics(metrics)

		// Sleep before the next collection
		time.Sleep(5 * time.Second)
	}
}

// Attach a tracepoint
func attachTracepoint(collections map[string]*ebpf.Collection, progName, category, event string) {
	if prog := collections[progName].Programs[progName]; prog != nil {
		tpLink, err := link.Tracepoint(category, event, prog, nil)
		if err != nil {
			log.Fatalf("Failed to attach %s tracepoint: %v", progName, err)
		}
		defer tpLink.Close()
		log.Printf("Successfully attached tracepoint %s to %s/%s\n", progName, category, event)
	}
}

// Monitor DDoS attacks
func checkDDoS(ddosMap *ebpf.Map) int {
	fmt.Println("Checking for potential DoS/DDoS attacks...")
	iter := ddosMap.Iterate()
	var key uint32
	var count uint64
	total := 0
	for iter.Next(&key, &count) {
		total += int(count)
	}
	return total
}

// Monitor anomalies
func checkAnomalies(anomalyMap *ebpf.Map) int {
	fmt.Println("Checking for anomalies...")
	iter := anomalyMap.Iterate()
	var key uint32
	var count uint64
	total := 0
	for iter.Next(&key, &count) {
		total += int(count)
	}
	return total
}

// Monitor network performance
func checkNetworkPerformance(latencyMap *ebpf.Map) int {
	fmt.Println("Monitoring network performance...")
	iter := latencyMap.Iterate()
	var key uint32
	var value uint64
	total := 0
	for iter.Next(&key, &value) {
		total += int(value)
	}
	return total
}

// Monitor dropped packets
func checkDroppedPackets(dropMap *ebpf.Map) int {
	fmt.Println("Monitoring dropped packets...")
	iter := dropMap.Iterate()
	var key uint32
	var count uint64
	total := 0
	for iter.Next(&key, &count) {
		total += int(count)
	}
	return total
}

// Monitor application-level metrics
func checkAppMetrics(appMap *ebpf.Map) int {
	fmt.Println("Monitoring application-level metrics...")
	iter := appMap.Iterate()
	var key uint32
	var value uint64
	total := 0
	for iter.Next(&key, &value) {
		total += int(value)
	}
	return total
}

// Send metrics to the server
func sendMetrics(metrics map[string]interface{}) {
	jsonData, err := json.Marshal(metrics)
	if err != nil {
		log.Println("Failed to encode metrics:", err)
		return
	}

	resp, err := http.Post(serverHTTP, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("Failed to send metrics to server:", err)
		return
	}
	defer resp.Body.Close()

	log.Println("Metrics sent successfully")
}

// Listen for WebSocket alerts from the server
func listenForAlerts() {
	conn, _, err := websocket.DefaultDialer.Dial(serverWS, nil)
	if err != nil {
		log.Println("WebSocket connection failed:", err)
		return
	}
	defer conn.Close()

	log.Println("Connected to WebSocket server for real-time alerts")

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}
		log.Println("🚨 Alert received:", string(msg))
	}
}


