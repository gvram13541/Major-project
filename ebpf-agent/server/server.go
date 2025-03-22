package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Connected WebSocket clients
var clients = make(map[*websocket.Conn]bool)
var clientsLock sync.Mutex

// Latest metrics storage
var latestMetrics = make(map[string]interface{})
var metricsLock sync.Mutex

func main() {
	// WebSocket endpoint for real-time alerts
	http.HandleFunc("/ws", handleWebSocket)

	// HTTP API for polling latest metrics
	http.HandleFunc("/metrics", handleMetrics)

	// HTTP API to receive metrics from the agent
	http.HandleFunc("/update-metrics", receiveMetrics)

	serverAddr := ":8080"
	fmt.Println("Server running on", serverAddr)
	log.Fatal(http.ListenAndServe(serverAddr, nil))
}

// Handle WebSocket connections for real-time alerts
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	clientsLock.Lock()
	clients[conn] = true
	clientsLock.Unlock()

	log.Println("New WebSocket client connected.")

	// Listen for disconnection
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			clientsLock.Lock()
			delete(clients, conn)
			clientsLock.Unlock()
			log.Println("WebSocket client disconnected.")
			break
		}
	}
}

// Handle HTTP polling for latest metrics
func handleMetrics(w http.ResponseWriter, r *http.Request) {
	metricsLock.Lock()
	defer metricsLock.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(latestMetrics)
}

// Receive metrics from the agent (HTTP POST)
func receiveMetrics(w http.ResponseWriter, r *http.Request) {
	var metrics map[string]interface{}

	if err := json.NewDecoder(r.Body).Decode(&metrics); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	metricsLock.Lock()
	latestMetrics = metrics
	metricsLock.Unlock()

	log.Println("Received updated metrics:", metrics)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Metrics updated successfully"))
}

// Broadcast real-time anomaly alerts to WebSocket clients
func broadcastAlert(alertMsg string) {
	clientsLock.Lock()
	defer clientsLock.Unlock()

	for conn := range clients {
		err := conn.WriteMessage(websocket.TextMessage, []byte(alertMsg))
		if err != nil {
			log.Println("Error sending WebSocket message:", err)
			conn.Close()
			delete(clients, conn)
		}
	}
}

