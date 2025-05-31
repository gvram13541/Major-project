package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"syscall"
	"time"
	"bufio"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/disk"
	"github.com/shirou/gopsutil/mem"
	"github.com/shirou/gopsutil/process"
	"github.com/gorilla/websocket"
)

const (
	progPath          = "ebpf.o"
	// Change this to your local server if testing locally
	 serverURL	= "wss://5498-49-204-87-250.ngrok-free.app/ws"
	//serverURL         = "wss://after-pine-sapphire-modems.trycloudflare.com/ws"
	// OR keep the ngrok URL if you're accessing a remote server
	//serverURL        = "wss://b22f-152-58-230-101.ngrok-free.app/socket.io/?EIO=4&transport=websocket"
	bandwidthThresholdMB    = 10 * 1024 * 1024 // 10 MB
	blockCheckSeconds = 15
	
)

var blockedIPs = make(map[string]bool)

type EbpfObjects struct {
	Program            *ebpf.Program
	HTTPReqMap         *ebpf.Map
	OutboundTrafficMap *ebpf.Map
	BandwidthMap       *ebpf.Map
	FirewallMap        *ebpf.Map
	DNSQueryMap        *ebpf.Map
	LatencyMap         *ebpf.Map
	JitterMap          *ebpf.Map
	TCPStateMap        *ebpf.Map
	DroppedMap         *ebpf.Map
	FailedConnMap      *ebpf.Map
	TopTalkersMap      *ebpf.Map
	ProtocolTrafficMap *ebpf.Map
	InterfaceStatsMap  *ebpf.Map
	PerProcMap         *ebpf.Map
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
		TCPStateMap:        coll.Maps["tcp_state_map"],
		DroppedMap:         coll.Maps["dropped_map"],
		FailedConnMap:      coll.Maps["failed_conn_map"],
		TopTalkersMap:      coll.Maps["top_talkers_map"],
		ProtocolTrafficMap: coll.Maps["protocol_traffic_map"],
		InterfaceStatsMap:  coll.Maps["interface_stats_map"],
		PerProcMap:         coll.Maps["per_process_map"],
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

	// Create a WebSocket connection
	//dialer := websocket.DefaultDialer
	// Increase timeouts 
	//dialer.HandshakeTimeout = 20 * time.Second
	
	//wsConn, resp, err := dialer.Dial(serverURL, nil)
	//if err != nil {
		//if resp != nil {
			//log.Printf("❌ WebSocket connection failed with status: %d", resp.StatusCode)
		//}
		//log.Fatalf("❌ WebSocket connection failed: %v", err)
	//}
	//defer wsConn.Close()
	
	//fmt.Println("✅ Connected to WebSocket server")
	
	// Handle Socket.IO handshake
	//go handleSocketIOMessages(wsConn)
	
	
	
	
	conn, _, err := websocket.DefaultDialer.Dial(serverURL, nil)
	if err != nil {
		log.Fatalf("WebSocket connection failed: %v", err)
	}
	defer conn.Close()
	
	go listenForServerCommands(conn)

	// Start streaming metrics
	go streamMetrics(objs, conn)
	
	// Start USB monitoring in a new goroutine
	go monitorUSB(conn) 

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	fmt.Println("🔻 Shutting down and detaching XDP Program...")
}


func listenForServerCommands(conn *websocket.Conn) {
	go func() {
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Printf("❌ Error reading from WebSocket: %v", err)
				return
			}

			var response map[string]interface{}
			if err := json.Unmarshal(msg, &response); err != nil {
				log.Printf("❌ Failed to unmarshal server response: %v", err)
				continue
			}

			// Check if it's a block command
			if event, ok := response["event"].(string); ok && event == "block" {
				data, ok := response["data"].(map[string]interface{})
				if !ok {
					continue
				}
				ip, ok := data["ip"].(string)
				if ok {
					log.Printf("🛡️ Server requested block for IP %s", ip)
					blockIP(ip)
				}
			}
		}
	}()
}


func streamMetrics(objs EbpfObjects, conn *websocket.Conn) {
	ticker := time.NewTicker(time.Duration(blockCheckSeconds) * time.Second)
	defer ticker.Stop()

	agentID := getMACAddress()

	for range ticker.C {
		systemMetrics := collectSystemMetrics()
		ebpfMetrics := map[string]map[string]uint64{}
		ebpfMapNames := map[string]*ebpf.Map{
			"HTTP Requests":         objs.HTTPReqMap,
			"Outbound Traffic":      objs.OutboundTrafficMap,
			"Bandwidth Usage":       objs.BandwidthMap,
			"Firewall Rules":        objs.FirewallMap,
			"DNS Queries":           objs.DNSQueryMap,
			"Latency":               objs.LatencyMap,
			"Jitter":                objs.JitterMap,
			"TCP State Transitions": objs.TCPStateMap,
			"Dropped Packets":       objs.DroppedMap,
			"Failed Connections":    objs.FailedConnMap,
			"Top Talkers":           objs.TopTalkersMap,
			"Protocol Traffic":      objs.ProtocolTrafficMap,
			"Interface Stats":       objs.InterfaceStatsMap,
			"Per Process Traffic":   objs.PerProcMap,
		}

		for name, m := range ebpfMapNames {
			ebpfMetrics[name] = readMap(m)
		}
		
		// 🚨 Check Bandwidth Usage and call alert sender
		for ipStr, bytesUsed := range ebpfMetrics["Bandwidth Usage"] {
			mbUsed := float64(bytesUsed) / (1024 * 1024)
			if mbUsed > bandwidthThresholdMB {
				sendBandwidthAlert(conn, agentID, ipStr, mbUsed)
			}
		}

		fullMetrics := map[string]interface{}{
			"agent_id": agentID,
			"event":    "metric",
			"data": map[string]interface{}{
				"System Metrics": systemMetrics,
				"eBPF Metrics":   ebpfMetrics,
			},
		}
		
		

		payload, err := json.Marshal(fullMetrics)
		if err != nil {
			log.Printf("❌ Failed to marshal metrics: %v", err)
			continue
		}
		err = conn.WriteMessage(websocket.TextMessage, payload)
		if err != nil {
			log.Printf("❌ Failed to send metrics: %v", err)
			return
		}
		log.Println("✅ Sent metrics")
	}
}

func sendBandwidthAlert(conn *websocket.Conn, agentID, ip string, mbUsed float64) {
	alert := map[string]interface{}{
		"agent_id": agentID,
		"event":    "alert",
		"data": map[string]interface{}{
			"alert_type": "high_bandwidth",
			"ip":         ip,
			"bandwidth":  fmt.Sprintf("%.2f MB", mbUsed),
			"message":    fmt.Sprintf("High bandwidth usage from IP %s", ip),
			"timestamp":  time.Now().Format(time.RFC3339),
		},
	}
	alertJSON, _ := json.Marshal(alert)
	err := conn.WriteMessage(websocket.TextMessage, alertJSON)
	if err != nil {
		log.Printf("❌ Failed to send bandwidth alert: %v", err)
	} else {
		log.Printf("🚨 Bandwidth alert sent for IP %s", ip)
	}
}


// The rest of the code remains the same...
func blockIP(ip string) {
	cmd := exec.Command("iptables", "-A", "INPUT", "-s", ip, "-j", "DROP")
	err := cmd.Run()
	if err != nil {
		fmt.Printf("❌ Failed to block IP %s: %v\n", ip, err)
	}
}

func collectSystemMetrics() map[string]interface{} {
	metrics := make(map[string]interface{})

	if cpuPercentages, err := cpu.Percent(0, true); err == nil {
		metrics["CPU Usage"] = cpuPercentages
	}
	if memStats, err := mem.VirtualMemory(); err == nil {
		metrics["Total Memory (GB)"] = float64(memStats.Total) / (1024 * 1024 * 1024)
		metrics["Used Memory (GB)"] = float64(memStats.Used) / (1024 * 1024 * 1024)
		metrics["Free Memory (GB)"] = float64(memStats.Free) / (1024 * 1024 * 1024)
	}
	if diskStats, err := disk.Usage("/"); err == nil {
		metrics["Total Disk (GB)"] = float64(diskStats.Total) / (1024 * 1024 * 1024)
		metrics["Used Disk (GB)"] = float64(diskStats.Used) / (1024 * 1024 * 1024)
		metrics["Free Disk (GB)"] = float64(diskStats.Free) / (1024 * 1024 * 1024)
	}
	metrics["Per Process"] = collectPerProcessMetrics()
	metrics["Open Tabs"] = getOpenTabs()

	return metrics
}

func collectPerProcessMetrics() []map[string]interface{} {
	procs, err := process.Processes()
	if err != nil {
		log.Printf("Error getting process list: %v", err)
		return nil
	}

	var results []map[string]interface{}
	for _, p := range procs {
		username, _ := p.Username()
		if username == "root" || username == "systemd-network" || username == "nobody" {
			continue
		}
		exe, _ := p.Exe()
		if exe == "" || isSystemProcessPath(exe) {
			continue
		}
		name, _ := p.Name()
		if name == "" || name[0] == '[' || isSystemDaemon(name) {
			continue
		}
		cpuPercent, _ := p.CPUPercent()
		memPercent, _ := p.MemoryPercent()
		ioCounters, _ := p.IOCounters()

		results = append(results, map[string]interface{}{
			"PID":         p.Pid,
			"Name":        name,
			"User":        username,
			"Executable":  exe,
			"CPU (%)":     cpuPercent,
			"Memory (%)":  float64(memPercent),
			"ReadBytes":   ioCounters.ReadBytes,
			"WriteBytes":  ioCounters.WriteBytes,
		})
	}
	return results
}

func isSystemProcessPath(path string) bool {
	systemPaths := []string{"/usr/sbin", "/sbin", "/lib", "/lib64", "/usr/lib", "/usr/libexec"}
	for _, prefix := range systemPaths {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}
	return false
}

func isSystemDaemon(name string) bool {
	systemNames := []string{
		"systemd", "dbus-daemon", "bash", "sshd", "agetty", "cron", "kworker",
		"init", "login", "polkitd", "udisksd", "NetworkManager", "accounts-daemon",
	}
	for _, sysName := range systemNames {
		if name == sysName {
			return true
		}
	}
	return false
}

func readMap(m *ebpf.Map) map[string]uint64 {
	result := make(map[string]uint64)
	if m == nil {
		return result
	}
	switch m.KeySize() {
	case 4:
		var key uint32
		var value uint64
		iter := m.Iterate()
		for iter.Next(&key, &value) {
			result[intToIP(key)] = value
		}
	case 16:
		var key [16]byte
		var value uint64
		iter := m.Iterate()
		for iter.Next(&key, &value) {
			result[net.IP(key[:]).String()] = value
		}
	default:
		var key [64]byte
		var value uint64
		iter := m.Iterate()
		for iter.Next(&key, &value) {
			result[string(bytes.TrimRight(key[:], "\x00"))] = value
		}
	}
	return result
}

func intToIP(n uint32) string {
	bytes := make([]byte, 4)
	binary.LittleEndian.PutUint32(bytes, n)
	return net.IP(bytes).String()
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

func getMACAddress() string {
	ifaces, err := net.Interfaces()
	if err != nil {
		log.Fatalf("❌ Error getting interfaces: %v", err)
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagLoopback == 0 && len(iface.HardwareAddr) > 0 {
			return iface.HardwareAddr.String()
		}
	}
	log.Fatalf("❌ No suitable MAC address found for agent_id")
	return ""
}

func getOpenTabs() []map[string]string {
	resp, err := http.Get("http://localhost:9222/json")
	if err != nil {
		log.Printf("❌ Failed to fetch open tabs: %v", err)
		return nil
	}
	defer resp.Body.Close()

	var tabs []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tabs); err != nil {
		log.Printf("❌ Failed to decode tabs JSON: %v", err)
		return nil
	}

	var results []map[string]string
	for _, tab := range tabs {
		title, _ := tab["title"].(string)
		url, _ := tab["url"].(string)
		if title != "" && url != "" {
			results = append(results, map[string]string{
				"Title": title,
				"URL":   url,
			})
		}
	}
	return results
}

// monitorUSB starts a process that listens for USB insertions using udevadm
// monitorUSB starts a process that listens for USB insertions using udevadm
func monitorUSB(wsConn *websocket.Conn) {
	// Start monitoring USB events using udevadm
	cmd := exec.Command("udevadm", "monitor", "--udev", "--subsystem-match=usb")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		panic(err)
	}

	if err := cmd.Start(); err != nil {
		panic(err)
	}

	fmt.Println("Monitoring USB insertions...")

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		// Print out the raw event for debugging purposes
		fmt.Println("Detected event:", line)

		// Check if the line contains an "add" event for USB devices
		if strings.Contains(line, "add") && strings.Contains(line, "usb") {
			fmt.Println("🔌 USB device inserted!")

			sendUSBAlert(wsConn)
		}
	}
}


// getUSBDeviceDetails parses the event string to extract USB device details
func getUSBDeviceDetails(event string) string {
	// You can extract more information if needed from the event string
	// Here we're just extracting the device name for simplicity
	// You can enhance this function to parse more device-specific details
	if strings.Contains(event, "ID_MODEL=") {
		return extractValue(event, "ID_MODEL=")
	}
	return "Unknown USB Device"
}

// extractValue extracts the value associated with a key in the event string
func extractValue(event, key string) string {
	start := strings.Index(event, key)
	if start == -1 {
		return ""
	}
	start += len(key)
	end := strings.Index(event[start:], "\n")
	if end == -1 {
		end = len(event)
	}
	return event[start : start+end]
}

// sendUSBAlert sends an alert to the WebSocket when a USB device is inserted
func sendUSBAlert(wsConn *websocket.Conn) {
	agentID := getMACAddress()
	ipAddress := getLocalIP()

	alert := map[string]interface{}{
		"agent_id": agentID,
		"event":    "alert",
		"data": map[string]interface{}{
			"alert_type": "usb_insertion",
			"message":    fmt.Sprintf("USB device inserted on system with IP %s", ipAddress),
			"timestamp":  time.Now().Format(time.RFC3339),
		},
	}
	alertJSON, _ := json.Marshal(alert)
	err := wsConn.WriteMessage(websocket.TextMessage, alertJSON)
	if err != nil {
		log.Printf("❌ Failed to send USB alert: %v", err)
	} else {
		fmt.Println("🚨 USB Alert sent")
	}
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "unknown"
	}
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if ip4 := ipNet.IP.To4(); ip4 != nil {
				return ip4.String()
			}
		}
	}
	return "unknown"
}


