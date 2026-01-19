#!/bin/bash

# Church Production Dashboard - Robust Pi Installer
# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Starting Production Dashboard Installation..."

# 1. Fix NPM Global Prefix & Permissions (Resolves EACCES)
echo "🔧 Fixing NPM permissions and local configuration..."
# Reset any global prefix that might be pointing to /usr/lib
npm config delete prefix || true
npm config set prefix /home/$(whoami)/.npm-global || true
mkdir -p /home/$(whoami)/.npm-global

# Ensure ownership of the project and npm cache
sudo chown -R $(whoami):$(whoami) $(pwd)
sudo chown -R $(whoami):$(whoami) ~/.npm || true

# 2. Update Package Lists
echo "📦 Updating package lists..."
sudo apt-get update -y

# 3. Install Core System Dependencies & Browser
# Most modern Pi OS versions use 'chromium', not 'chromium-browser'
echo "📦 Installing system dependencies..."
sudo apt-get install -y nodejs npm xserver-xorg x11-xserver-utils xinit openbox git chromium

# Identify the browser command
if command -v chromium > /dev/null 2>&1; then
    BROWSER_BIN="chromium"
elif command -v chromium-browser > /dev/null 2>&1; then
    BROWSER_BIN="chromium-browser"
else
    echo "❌ ERROR: Chromium browser not found."
    exit 1
fi

# 4. Application Setup
APP_DIR=$(pwd)
echo "📂 Working directory: $APP_DIR"

# 5. Build the App
echo "🔨 Installing Node dependencies..."
# We use --no-save to avoid touching system files if environment is unstable
npm install --no-fund --no-audit

echo "🔨 Building the production dashboard..."
npm run build

# 6. Configure Kiosk Mode (Openbox)
echo "🖥️ Configuring Kiosk mode..."
mkdir -p ~/.config/openbox
cat <<EOF > ~/.config/openbox/autostart
# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Start the dashboard server using the LOCAL binary to avoid permission issues
cd $APP_DIR
./node_modules/.bin/serve -s dist -l 3000 &

# Wait for server to be ready
sleep 10

# Launch Browser in Kiosk Mode
$BROWSER_BIN --noerrdialogs --disable-infobars --kiosk http://localhost:3000 --disable-restore-session-state --no-first-run
EOF

# 7. Setup Auto-Launch on Boot (X-Server)
echo "⚙️ Setting up auto-start via .bash_profile..."
if ! grep -q "exec startx" ~/.bash_profile; then
cat <<EOF >> ~/.bash_profile

# Auto-start X11 on login to TTY1
if [ -z "\$DISPLAY" ] && [ "\$XDG_VTNR" -eq 1 ]; then
  exec startx
fi
EOF
fi

# 8. Success
echo "-------------------------------------------------------"
echo "✅ INSTALLATION SUCCESSFUL"
echo "-------------------------------------------------------"
echo "The dashboard will now launch automatically on boot."
echo "-------------------------------------------------------"
echo "Rebooting in 5 seconds..."
sleep 5
sudo reboot
