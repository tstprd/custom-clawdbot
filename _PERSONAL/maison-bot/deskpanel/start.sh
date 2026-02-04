#!/bin/bash
# Lancer le dashboard + SSH
cd ~/phone-dashboard

# Start SSH si pas déjà lancé
pgrep sshd > /dev/null || sshd

# Start server
echo "Dashboard: http://localhost:3333"
echo "SSH: port 8022"
node server.js
