import urllib.request
import json

cities = ['Rennes', 'Paris', 'Lille']

for city in cities:
    with urllib.request.urlopen(f'https://wttr.in/{city}?format=j1') as r:
        data = json.loads(r.read())
    
    curr = data['current_condition'][0]
    temp = curr['temp_C']
    desc = curr['weatherDesc'][0]['value']
    
    # Check for rain today
    today = data['weather'][0]
    rain_chance = 0
    for h in today.get('hourly', []):
        rain_chance = max(rain_chance, int(h.get('chanceofrain', 0)))
    
    rain_info = f"🌧️ {rain_chance}%" if rain_chance > 30 else "☀️"
    
    print(f"=== {city.upper()} ===")
    print(f"Actuel: {temp}°C {desc} {rain_info}")
    
    # 5 day forecast
    forecasts = []
    for day in data['weather'][1:6]:  # skip today, get next 5
        date = day['date']
        d = date.split('-')
        day_str = f"{d[2]}/{d[1]}"
        min_t = day.get('mintempC', '?')
        max_t = day.get('maxtempC', '?')
        # Check rain
        day_rain = 0
        for h in day.get('hourly', []):
            day_rain = max(day_rain, int(h.get('chanceofrain', 0)))
        rain_icon = "🌧" if day_rain > 50 else ""
        forecasts.append(f"{day_str}:{min_t}/{max_t}{rain_icon}")
    
    print("Prévisions: " + " | ".join(forecasts))
    print()
