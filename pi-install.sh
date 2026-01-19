#!/bin/bash

# Church Production Dashboard - Pi 3 Installer
# Run this via SSH: curl -sL [link-to-script] | bash

echo "🚀 Starting Production Dashboard Installation..."

# 1. System Updates
sudo apt update
sudo apt install -y nodejs npm xserver-xorg x11-xserver-utils xinit openbox chromium-browser git

# 2. Setup App Directory
mkdir -p ~/dashboard
cd ~/dashboard

# 3. Install Node Dependencies
npm install
npm install -g serve

# 4. Configure Autostart (Openbox)
mkdir -p ~/.config/openbox
cat <<EOF > ~/.config/openbox/autostart
# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Start the dashboard server
serve -s . -l 3000 &

# Launch Chromium in Kiosk Mode
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000
EOF

# 5. Setup Boot to GUI
cat <<EOF >> ~/.bash_profile
if [ -z "\$DISPLAY" ] && [ "\$XDG_VTNR" -eq 1 ]; then
  exec startx
EOF

# 6. Wi-Fi Provisioning Hint
echo "-------------------------------------------------------"
echo "✅ INSTALLATION COMPLETE"
echo "-------------------------------------------------------"
echo "To enable the 'Create Wi-Fi on Boot' feature, we recommend:"
echo "sudo apt install -y hostapd dnsmasq"
echo "Or install RaspAP for a full web UI: curl -sL https://install.raspap.com | bash"
echo ""
echo "Rebooting in 5 seconds..."
sleep 5
sudo reboot