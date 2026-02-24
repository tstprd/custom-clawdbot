#!/usr/bin/env python3
"""Analyze VTech PCAP to find credentials."""
import os
import re

# Read PCAP file as binary and extract readable strings
pcap_file = r"C:\Users\jules\repo\clawdbot\_PERSONAL\vtech_capture.pcap"
ssl_keys_file = r"C:\Users\jules\repo\clawdbot\_PERSONAL\sslkeys.txt"

with open(pcap_file, 'rb') as f:
    data = f.read()

# Convert to string, ignoring errors
text = data.decode('utf-8', errors='ignore')

# Look for JSON-like patterns with uid or auth
patterns = [
    r'"uid"\s*:\s*"([^"]+)"',
    r'"auth_key"\s*:\s*"([^"]+)"',
    r'"authKey"\s*:\s*"([^"]+)"',
    r'uid=([a-zA-Z0-9_-]+)',
    r'VTECH[A-Z0-9_-]{10,}',
    r'[A-Z]{4,6}[0-9]{6,}[A-Z0-9]*',  # VTech UID pattern
]

print("=== Searching for VTech credentials ===\n")

for pattern in patterns:
    matches = re.findall(pattern, text, re.IGNORECASE)
    if matches:
        print(f"Pattern: {pattern}")
        for m in set(matches)[:10]:
            print(f"  Found: {m}")
        print()

# Also look for any JSON objects
json_pattern = r'\{[^{}]*"[^"]*"[^{}]*\}'
json_matches = re.findall(json_pattern, text)
vtech_jsons = [j for j in json_matches if 'vtech' in j.lower() or 'uid' in j.lower() or 'auth' in j.lower()]
if vtech_jsons:
    print("=== JSON fragments ===")
    for j in vtech_jsons[:5]:
        print(j[:200])
        print()

# Check for HTTP headers
http_pattern = r'(GET|POST|PUT) [^\r\n]+\r?\n'
http_matches = re.findall(http_pattern, text)
if http_matches:
    print("=== HTTP requests ===")
    for h in http_matches[:10]:
        print(h)
