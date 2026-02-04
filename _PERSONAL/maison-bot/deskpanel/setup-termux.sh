#!/bin/bash
# Setup script pour Termux sur Xiaomi 11 Lite 5G
# Exécuter dans Termux après installation

set -e

echo "=== Phone Dashboard - Setup Termux ==="

# Update packages
echo "[1/6] Mise à jour packages..."
pkg update -y && pkg upgrade -y

# Install Node.js and tools
echo "[2/6] Installation Node.js, SSH, Git..."
pkg install -y nodejs openssh git termux-services

# Setup SSH
echo "[3/6] Configuration SSH..."
mkdir -p ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -q 2>/dev/null || true

# Generate host keys for sshd
ssh-keygen -A 2>/dev/null || true

# Set password for SSH access
echo "[!] Définir un mot de passe pour SSH:"
passwd

# Create project directory
echo "[4/6] Création du projet..."
mkdir -p ~/phone-dashboard
cd ~/phone-dashboard

# Create package.json
cat > package.json << 'EOF'
{
  "name": "phone-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.16.0"
  }
}
EOF

# Install npm dependencies
echo "[5/6] Installation dépendances npm..."
npm install

echo "[6/6] Setup terminé!"
echo ""
echo "=== Prochaines étapes ==="
echo ""
echo "1. Copie les fichiers depuis ton PC:"
echo "   scp -P 8022 index.html server.js content.json user@PHONE_IP:~/phone-dashboard/"
echo ""
echo "2. Lance le serveur:"
echo "   cd ~/phone-dashboard && node server.js"
echo ""
echo "3. Dans un navigateur sur le téléphone:"
echo "   http://localhost:3333"
echo ""
echo "4. Pour SSH depuis l'extérieur:"
echo "   sshd   # Lance le serveur SSH sur port 8022"
echo "   # Puis: ssh -p 8022 IP_PHONE"
echo ""
echo "5. Pour garder Termux actif:"
echo "   - Tire la notification Termux vers le bas"
echo "   - Clique 'Acquire wakelock'"
echo ""
