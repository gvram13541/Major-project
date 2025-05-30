#!/bin/bash

set -e

echo "🔧 Setting up Python virtualenv with Go installed inside..."

### Step 1: Install system packages
echo "📦 Installing required system dependencies..."
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
  python3-venv \
  python3-pip

### Step 2: Fix bpftool if needed
if ! command -v bpftool &> /dev/null; then
  echo "🔗 Linking bpftool..."
  sudo ln -s /usr/lib/linux-tools-$(uname -r)/bpftool /usr/bin/bpftool
fi

### Step 3: Create and activate Python venv
echo "🐍 Creating virtualenv: ebpf-go-env..."
python3 -m venv ebpf-go-env
source ebpf-go-env/bin/activate

### Step 4: Install Python packages
echo "📦 Installing Python eBPF packages..."
pip install --upgrade pip
pip install bcc pyroute2

### Step 5: Download and install Go inside venv
GO_VERSION="1.22.2"
GO_TAR="go$GO_VERSION.linux-amd64.tar.gz"
GO_URL="https://go.dev/dl/$GO_TAR"
GO_ROOT="$(pwd)/ebpf-go-env/go"
GOPATH="$(pwd)/ebpf-go-env/gopath"

echo "⬇️ Downloading Go $GO_VERSION..."
wget -q $GO_URL
tar -C ebpf-go-env -xzf $GO_TAR
rm $GO_TAR

# Export now
export GOROOT=$GO_ROOT
export GOPATH=$GOPATH
export PATH=$GOROOT/bin:$GOPATH/bin:$PATH

# Add to venv activate script
ACTIVATE_SCRIPT="$(pwd)/ebpf-go-env/bin/activate"
echo "" >> $ACTIVATE_SCRIPT
echo "# Go environment" >> $ACTIVATE_SCRIPT
echo "export GOROOT=$GO_ROOT" >> $ACTIVATE_SCRIPT
echo "export GOPATH=$GOPATH" >> $ACTIVATE_SCRIPT
echo "export PATH=\$GOROOT/bin:\$GOPATH/bin:\$PATH" >> $ACTIVATE_SCRIPT

### Step 6: Done
echo ""
echo "✅ Setup complete!"
echo "➡️ To use this environment:"
echo "   source ebpf-go-env/bin/activate"
echo "   go version"
echo "   go run main.go (in any folder you want)"

