import urllib.request
import json
from datetime import datetime

cities = ['Rennes', 'Paris', 'Lille']
now_hour = datetime.now().hour

for city in cities:
    with urllib.request.urlopen(f'https://wttr.in/{city}?format=j1') as r:
        data = json.loads(r.read())
    
    print(f"=== {city.upper()} ===")
    
    # Get today's hourly data
    today = data['weather'][0]
    tomorrow = data['weather'][1] if len(data['weather']) > 1 else None
    
    hours_data = []
    for h in today.get('hourly', []):
        hour = int(h['time']) // 100
        rain = int(h.get('chanceofrain', 0))
        hours_data.append((hour, rain))
    
    if tomorrow:
        for h in tomorrow.get('hourly', []):
            hour = int(h['time']) // 100
            rain = int(h.get('chanceofrain', 0))
            hours_data.append((hour + 24, rain))
    
    # Filter next 12 hours from now
    next_12h = []
    for hour, rain in hours_data:
        actual_hour = hour if hour < 24 else hour - 24
        if hour >= now_hour and len(next_12h) < 12:
            next_12h.append((actual_hour, rain))
        elif hour >= 24 and len(next_12h) < 12:
            next_12h.append((actual_hour, rain))
    
    # Print the data
    for h, r in next_12h[:12]:
        bar = '█' * (r // 10) if r > 0 else '·'
        print(f"{h:02d}h: {r:3d}% {bar}")
