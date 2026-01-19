#!/bin/bash

# Church Production Dashboard - Resilient Pi Installer
echo "🚀 Starting Production Dashboard Installation..."

# 1. Update Package Lists
echo "📦 Updating package lists..."
sudo apt update

# 2. Install Core System Dependencies
echo "📦 Installing system dependencies..."
sudo apt install -y nodejs npm xserver-xorg x11-xserver-utils xinit openbox git

# 3. Detect and Install Browser
echo "🔍 Detecting browser package..."
if sudo apt install -y chromium; then
    BROWSER_BIN="chromium"
elif sudo apt install -y chromium-browser; then
    BROWSER_BIN="chromium-browser"
else
    echo "❌ ERROR: Could not find chromium or chromium-browser packages."
    exit 1
fi
echo "✅ Using browser: $BROWSER_BIN"

# 4. Application Setup
echo "📂 Setting up application directory..."
# Use current directory or default to ~/dashboard
APP_DIR=$(pwd)
echo "📍 Working in: $APP_DIR"

# 5. Build the App
echo "🔨 Installing Node dependencies..."
npm install

echo "🔨 Building the dashboard..."
npm run build

# 6. Configure Kiosk Mode (Openbox)
echo "🖥️ Configuring Kiosk mode..."
mkdir -p ~/.config/openbox
cat <<EOF > ~/.config/openbox/autostart
# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Start the dashboard server using the local npx serve
# This avoids the 'permission denied' global install error
cd $APP_DIR
npx serve -s dist -l 3000 &

# Wait for server to be ready
sleep 5

# Launch Browser in Kiosk Mode
$BROWSER_BIN --noerrdialogs --disable-infobars --kiosk http://localhost:3000 --disable-restore-session-state
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
echo "✅ INSTALLATION COMPLETE"
echo "-------------------------------------------------------"
echo "The dashboard is now configured to launch on boot."
echo "-------------------------------------------------------"
echo "Rebooting in 5 seconds..."
sleep 5
sudo reboot
