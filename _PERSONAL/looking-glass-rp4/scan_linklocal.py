import concurrent.futures
import socket
import subprocess
import sys
import time

# Fast probe of common Raspberry Pi services over APIPA/link-local.
# Avoids requiring nmap. Windows will ARP as it connects.
ports = [22, 80, 443, 1880, 5900, 8000, 8080, 8798]
base = "169.254"
found = []

def probe(ip):
    hits = []
    for port in ports:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.08)
        try:
            if s.connect_ex((ip, port)) == 0:
                hits.append(port)
        except OSError:
            pass
        finally:
            s.close()
    if hits:
        return ip, hits
    return None

ips = [f"{base}.{a}.{b}" for a in range(0, 256) for b in range(1, 255)]
start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=512) as ex:
    futs = {ex.submit(probe, ip): ip for ip in ips}
    for i, fut in enumerate(concurrent.futures.as_completed(futs), 1):
        r = fut.result()
        if r:
            found.append(r)
            print("FOUND", r[0], "ports", ",".join(map(str, r[1])), flush=True)
        if i % 5000 == 0:
            print(f"scanned {i}/{len(ips)} in {time.time()-start:.1f}s", flush=True)

print("DONE")
if not found:
    print("No TCP services found on common ports.")
else:
    for ip, hits in found:
        print(f"{ip}: {hits}")
