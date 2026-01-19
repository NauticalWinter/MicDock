#!/bin/bash

# Church Production Dashboard - Ultra-Resilient Pi Installer
echo "🚀 Starting Production Dashboard Installation..."

# 1. Permission Fix for NPM (Resolves EACCES)
echo "🔧 Fixing folder permissions..."
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) $(pwd)

# 2. Update Package Lists
echo "📦 Updating package lists (this may take a moment)..."
sudo apt-get update -y

# 3. Detect and Install Browser
echo "🔍 Searching for available browser packages..."
BROWSER_PKG=""
if apt-cache show chromium-browser > /dev/null 2>&1; then
    BROWSER_PKG="chromium-browser"
elif apt-cache show chromium > /dev/null 2>&1; then
    BROWSER_PKG="chromium"
elif apt-cache show firefox-esr > /dev/null 2>&1; then
    BROWSER_PKG="firefox-esr"
fi

if [ -z "$BROWSER_PKG" ]; then
    echo "❌ ERROR: No supported browser found in repositories."
    echo "Trying one last 'blind' install of chromium..."
    sudo apt-get install -y chromium || exit 1
    BROWSER_PKG="chromium"
else
    echo "✅ Found browser package: $BROWSER_PKG. Installing..."
    sudo apt-get install -y $BROWSER_PKG
fi

# Determine the binary name for the autostart config
if [ "$BROWSER_PKG" == "firefox-esr" ]; then
    BROWSER_BIN="firefox-esr"
else
    # Chromium often uses 'chromium-browser' or 'chromium' as the command
    if command -v chromium-browser > /dev/null 2>&1; then
        BROWSER_BIN="chromium-browser"
    else
        BROWSER_BIN="chromium"
    fi
fi

# 4. Install Core System Dependencies
echo "📦 Installing system dependencies..."
sudo apt-get install -y nodejs npm xserver-xorg x11-xserver-utils xinit openbox git

# 5. Application Setup
APP_DIR=$(pwd)
echo "📂 Setting up in: $APP_DIR"

# 6. Build the App
echo "🔨 Installing Node dependencies (Local only)..."
npm install --no-fund --no-audit

echo "🔨 Building the dashboard..."
npm run build

# 7. Configure Kiosk Mode (Openbox)
echo "🖥️ Configuring Kiosk mode..."
mkdir -p ~/.config/openbox
cat <<EOF > ~/.config/openbox/autostart
# Disable screen blanking and power management
xset s off
xset s noblank
xset -dpms

# Start the dashboard server using the local npx serve
cd $APP_DIR
npx serve -s dist -l 3000 &

# Wait for server to be ready
sleep 8

# Launch Browser in Kiosk Mode
if [ "$BROWSER_BIN" == "firefox-esr" ]; then
    $BROWSER_BIN --kiosk http://localhost:3000
else
    $BROWSER_BIN --noerrdialogs --disable-infobars --kiosk http://localhost:3000 --disable-restore-session-state --no-first-run
fi
EOF

# 8. Setup Auto-Launch on Boot (X-Server)
echo "⚙️ Setting up auto-start via .bash_profile..."
if ! grep -q "exec startx" ~/.bash_profile; then
cat <<EOF >> ~/.bash_profile

# Auto-start X11 on login to TTY1
if [ -z "\$DISPLAY" ] && [ "\$XDG_VTNR" -eq 1 ]; then
  exec startx
fi
EOF
fi

# 9. Success
echo "-------------------------------------------------------"
echo "✅ INSTALLATION COMPLETE"
echo "-------------------------------------------------------"
echo "Browser used: $BROWSER_PKG"
echo "Binary command: $BROWSER_BIN"
echo "-------------------------------------------------------"
echo "Rebooting in 5 seconds..."
sleep 5
sudo reboot
