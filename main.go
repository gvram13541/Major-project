package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "os"
    "strings"
)

type Tab struct {
    Title string `json:"title"`
    URL   string `json:"url"`
}

func main() {
    // Chromium DevTools Protocol endpoint (default port is 9222)
    devtoolsURL := "http://localhost:9222/json"

    // Make an HTTP GET request to fetch the list of open tabs
    resp, err := http.Get(devtoolsURL)
    if err != nil {
        fmt.Println("Error: Unable to connect to Chromium DevTools. Is Chromium running with remote debugging enabled?")
        os.Exit(1)
    }
    defer resp.Body.Close()

    // Read the response body
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Error reading response:", err)
        os.Exit(1)
    }

    // Parse the JSON response
    var tabs []Tab
    err = json.Unmarshal(body, &tabs)
    if err != nil {
        fmt.Println("Error parsing JSON:", err)
        os.Exit(1)
    }

    // Display only meaningful titles of the open tabs
    if len(tabs) == 0 {
        fmt.Println("No open tabs found.")
        return
    }

    fmt.Println("Open Tabs:")
    for _, tab := range tabs {
        // Filter out empty or irrelevant titles
        if tab.Title != "" && !strings.HasPrefix(tab.Title, "http") && len(tab.Title) > 5 {
            fmt.Println(tab.Title)
        }
    }
}