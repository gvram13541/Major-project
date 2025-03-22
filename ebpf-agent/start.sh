#!/bin/bash

set -e  # Exit on error

echo "Starting eBPF + Go environment setup..."

# Step 1: Install system dependencies
echo "Updating system and installing dependencies..."
sudo apt update && sudo apt install -y \
    clang \
    llvm \
    libelf-dev \
    libbpf-dev \
    iproute2 \
    iputils-ping \
    net-tools \
    make \
    gcc \
    git \
    linux-tools-common \
    linux-tools-generic \
    linux-tools-$(uname -r) \
    wget \
    docker.io

# Step 2: Ensure bpftool is available
if ! command -v bpftool &> /dev/null; then
    echo "bpftool not found! Creating symlink..."
    sudo ln -s /usr/lib/linux-tools-$(uname -r)/bpftool /usr/bin/bpftool
fi

# Step 3: Install Go (if not installed)
GO_VERSION="1.22.2"
GO_TAR="go$GO_VERSION.linux-amd64.tar.gz"
GO_URL="https://go.dev/dl/$GO_TAR"

if ! command -v go &> /dev/null; then
    echo "Installing Go $GO_VERSION..."
    wget $GO_URL
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf $GO_TAR
    rm $GO_TAR
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    source ~/.bashrc
fi

# Step 4: Ensure Docker is running
echo "Checking Docker status..."
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker..."
    sudo systemctl start docker
fi

# Step 5: Add user to Docker group (optional, avoids sudo for Docker)
if ! groups | grep -q "\bdocker\b"; then
    echo "Adding user to Docker group..."
    sudo usermod -aG docker $USER
    echo "Please log out and log back in for changes to take effect."
fi

# Step 6: Create Dockerfile
echo "Creating Dockerfile..."
cat <<EOF > Dockerfile
FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    clang \
    llvm \
    libelf-dev \
    libbpf-dev \
    iproute2 \
    iputils-ping \
    net-tools \
    make \
    gcc \
    git \
    linux-tools-common \
    linux-tools-generic \
    linux-tools-\$(uname -r) \
    wget && \
    ln -s /usr/lib/linux-tools-\$(uname -r)/bpftool /usr/bin/bpftool

# Install Go
ENV GO_VERSION=$GO_VERSION
ENV GOPATH=/go
ENV PATH=\$PATH:/usr/local/go/bin:\$GOPATH/bin

RUN wget https://go.dev/dl/go\$GO_VERSION.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go\$GO_VERSION.linux-amd64.tar.gz && \
    rm go\$GO_VERSION.linux-amd64.tar.gz && \
    mkdir -p \$GOPATH/src \$GOPATH/bin \$GOPATH/pkg

WORKDIR /ebpf
EOF

# Step 7: Build the Docker image
echo "Building Docker image..."
sudo docker build -t ebpf-go-env .

# Step 8: Run the Docker container
echo "Starting eBPF + Go environment..."
sudo docker run -it --privileged --rm --name ebpf-go-container ebpf-go-env /bin/bash

