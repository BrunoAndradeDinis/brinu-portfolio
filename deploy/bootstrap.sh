#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0 \"<deploy public key>\"" >&2
  exit 1
fi

DEPLOY_PUBKEY="${1:?Usage: sudo $0 \"<deploy public key>\"}"
DEPLOY_USER=deploy
SITE_ROOT=/var/www/brinu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y
apt-get install -y rsync curl gpg debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades

if [[ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]]; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
fi
apt-get install -y caddy

dpkg-reconfigure -f noninteractive unattended-upgrades

if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
printf 'restrict %s\n' "$DEPLOY_PUBKEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$SITE_ROOT" "$SITE_ROOT/releases"
install -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$SCRIPT_DIR/rollback.sh" "$SITE_ROOT/rollback.sh"

cat > /etc/ssh/sshd_config.d/10-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
AllowUsers ubuntu deploy
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
MaxAuthTries 3
LoginGraceTime 30
EOF
sshd -t
systemctl reload ssh

cat > /etc/sysctl.d/90-hardening.conf <<'EOF'
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
EOF
sysctl --system >/dev/null

apt-get install -y ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
bantime.increment = true
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

install -d -m 755 -o caddy -g caddy /var/log/caddy
install -m 644 "$SCRIPT_DIR/Caddyfile" /etc/caddy/Caddyfile
sudo -u caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl enable caddy
systemctl reload-or-restart caddy

echo "Server ready. Point DNS to this machine before the first deploy so Caddy can issue the certificate."
