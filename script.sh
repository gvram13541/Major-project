#!/bin/bash

# Define network interface
INTERFACE="enp0s8"

# Function to map domain to app
map_domain_to_app() {
    case $1 in
        "google.com") echo "YouTube, Gmail, Google Search" ;;
        "github.com") echo "GitHub" ;;
        "facebook.com") echo "Facebook" ;;
        "twitter.com") echo "Twitter" ;;
        "example.com") echo "Example Web App" ;;
        *) echo "Unknown App" ;;
    esac
}

# Capture DNS and HTTP/HTTPS traffic and filter out app names
sudo tcpdump -i $INTERFACE port 53 or port 80 or port 443 -n -l | while read line
do
    # Extract domain name from DNS queries (e.g., www.example.com)
    if [[ "$line" =~ ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.domain ]]; then
        IP=${BASH_REMATCH[1]}
        echo "Captured IP: $IP"
        # Resolve the IP to a domain name
        DOMAIN=$(dig +short -x $IP)
        if [[ -n "$DOMAIN" ]]; then
            echo "Resolved Domain: $DOMAIN"
            APP=$(map_domain_to_app $DOMAIN)
            echo "Application: $APP"
        else
            echo "Unable to resolve IP: $IP"
        fi
    fi
    
    # If the line contains HTTP/HTTPS traffic, extract the destination IP
    if [[ "$line" =~ IP\ ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\. ]]; then
        IP=${BASH_REMATCH[1]}
        echo "Captured IP: $IP"
        # Resolve the IP to a domain name
        DOMAIN=$(dig +short -x $IP)
        if [[ -n "$DOMAIN" ]]; then
            echo "Resolved Domain: $DOMAIN"
            APP=$(map_domain_to_app $DOMAIN)
            echo "Application: $APP"
        else
            echo "Unable to resolve IP: $IP"
        fi
    fi
done
