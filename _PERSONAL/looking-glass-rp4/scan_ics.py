import concurrent.futures
import socket
import subprocess

ports = [22, 80, 443, 1880, 5900, 8000, 8080, 8798]
ips = [f"192.168.137.{i}" for i in range(1,255)]

def ping(ip):
    r = subprocess.run(['ping.exe','-n','1','-w','180',ip], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return ip if r.returncode == 0 else None

def ports_open(ip):
    hits=[]
    for port in ports:
        s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.15)
        try:
            if s.connect_ex((ip, port)) == 0:
                hits.append(port)
        finally:
            s.close()
    return hits

alive=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=64) as ex:
    for r in ex.map(ping, ips):
        if r:
            alive.append(r)
print('alive', alive)
for ip in alive:
    print(ip, 'ports', ports_open(ip))
print('arp:')
subprocess.run(['arp.exe','-a'])
