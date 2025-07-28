#!/bin/bash
echo "Updating package lists and upgrading installed packages..."
sudo apt update && sudo apt upgrade -y

echo "Installing dependencies..."
sudo apt install -y git nano curl wget screenfetch

echo "Installing Node.js and npm..."
sudo apt install -y nodejs npm