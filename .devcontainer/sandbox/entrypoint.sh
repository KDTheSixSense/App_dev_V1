#!/bin/bash
set -e

# Apply iptables rules to block outgoing connections
# Allow established/related connections (responses to incoming requests)
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow localhost (internal loopback)
iptables -A OUTPUT -o lo -j ACCEPT

# Drop all other outgoing connections (prevent SSRF)
iptables -P OUTPUT DROP

# Switch to non-root user and run the server
# We use 'su' or 'gosu' to drop privileges
# Since we are running as root initially (to run iptables), we need to switch.
exec su sandboxuser -c "node server.js"
