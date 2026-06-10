# Regenerates fixtures.json from the WC2026 group-stage schedule.
# Times are US Eastern (ET, UTC-4 in June) -> converted to UTC ISO8601.
import json
from datetime import datetime, timedelta, timezone

STADIUM = {
    "Mexico City": "Estadio Azteca", "Guadalajara": "Estadio Akron",
    "Monterrey": "Estadio BBVA", "Toronto": "BMO Field", "Vancouver": "BC Place",
    "Los Angeles": "SoFi Stadium", "New York/New Jersey": "MetLife Stadium",
    "Boston": "Gillette Stadium", "San Francisco Bay Area": "Levi's Stadium",
    "Houston": "NRG Stadium", "Philadelphia": "Lincoln Financial Field",
    "Dallas": "AT&T Stadium", "Atlanta": "Mercedes-Benz Stadium",
    "Seattle": "Lumen Field", "Miami": "Hard Rock Stadium", "Kansas City": "Arrowhead Stadium",
}

raw = [
 ("2026-06-11","Mexico","South Africa","A","Mexico City","15:00"),
 ("2026-06-11","South Korea","UEFA Playoff D","A","Guadalajara","22:00"),
 ("2026-06-12","Canada","UEFA Playoff A","B","Toronto","15:00"),
 ("2026-06-12","United States","Paraguay","D","Los Angeles","21:00"),
 ("2026-06-13","Brazil","Morocco","C","New York/New Jersey","15:00"),
 ("2026-06-13","Australia","UEFA Playoff C","D","Vancouver","18:00"),
 ("2026-06-13","Haiti","Scotland","C","Boston","21:00"),
 ("2026-06-13","Qatar","Switzerland","B","San Francisco Bay Area","00:00+1"),
 ("2026-06-14","Germany","Curacao","E","Houston","13:00"),
 ("2026-06-14","Ivory Coast","Ecuador","E","Philadelphia","16:00"),
 ("2026-06-14","Netherlands","Japan","F","Dallas","19:00"),
 ("2026-06-14","UEFA Playoff B","Tunisia","F","Monterrey","22:00"),
 ("2026-06-15","Spain","Cape Verde","H","Atlanta","12:00"),
 ("2026-06-15","Belgium","Egypt","G","Seattle","15:00"),
 ("2026-06-15","Saudi Arabia","Uruguay","H","Miami","18:00"),
 ("2026-06-15","Iran","New Zealand","G","Los Angeles","21:00"),
 ("2026-06-16","France","Senegal","I","New York/New Jersey","15:00"),
 ("2026-06-16","FIFA Playoff 2","Norway","I","Boston","18:00"),
 ("2026-06-16","Argentina","Algeria","J","Kansas City","21:00"),
 ("2026-06-16","Austria","Jordan","J","San Francisco Bay Area","00:00+1"),
 ("2026-06-17","Portugal","FIFA Playoff 1","K","Houston","13:00"),
 ("2026-06-17","England","Croatia","L","Dallas","16:00"),
 ("2026-06-17","Ghana","Panama","L","Toronto","19:00"),
 ("2026-06-17","Uzbekistan","Colombia","K","Mexico City","22:00"),
 ("2026-06-18","UEFA Playoff D","South Africa","A","Atlanta","12:00"),
 ("2026-06-18","Switzerland","UEFA Playoff A","B","Los Angeles","15:00"),
 ("2026-06-18","Canada","Qatar","B","Vancouver","18:00"),
 ("2026-06-18","Mexico","South Korea","A","Guadalajara","21:00"),
 ("2026-06-19","United States","Australia","D","Seattle","15:00"),
 ("2026-06-19","Scotland","Morocco","C","Boston","18:00"),
 ("2026-06-19","Brazil","Haiti","C","Philadelphia","21:00"),
 ("2026-06-19","UEFA Playoff C","Paraguay","D","San Francisco Bay Area","00:00+1"),
 ("2026-06-20","Netherlands","UEFA Playoff B","F","Houston","13:00"),
 ("2026-06-20","Germany","Ivory Coast","E","Toronto","16:00"),
 ("2026-06-20","Ecuador","Curacao","E","Kansas City","20:00"),
 ("2026-06-20","Tunisia","Japan","F","Monterrey","00:00+1"),
 ("2026-06-21","Spain","Saudi Arabia","H","Atlanta","12:00"),
 ("2026-06-21","Belgium","Iran","G","Los Angeles","15:00"),
 ("2026-06-21","Uruguay","Cape Verde","H","Miami","18:00"),
 ("2026-06-21","New Zealand","Egypt","G","Vancouver","21:00"),
 ("2026-06-22","Argentina","Austria","J","Dallas","13:00"),
 ("2026-06-22","France","FIFA Playoff 2","I","Philadelphia","17:00"),
 ("2026-06-22","Norway","Senegal","I","New York/New Jersey","20:00"),
 ("2026-06-22","Jordan","Algeria","J","San Francisco Bay Area","23:00"),
 ("2026-06-23","Portugal","Uzbekistan","K","Houston","13:00"),
 ("2026-06-23","England","Ghana","L","Boston","16:00"),
 ("2026-06-23","Panama","Croatia","L","Toronto","19:00"),
 ("2026-06-23","Colombia","FIFA Playoff 1","K","Guadalajara","22:00"),
 ("2026-06-24","Canada","Switzerland","B","Vancouver","15:00"),
 ("2026-06-24","UEFA Playoff A","Qatar","B","Seattle","15:00"),
 ("2026-06-24","Scotland","Brazil","C","Miami","18:00"),
 ("2026-06-24","Morocco","Haiti","C","Atlanta","18:00"),
 ("2026-06-24","Mexico","UEFA Playoff D","A","Mexico City","21:00"),
 ("2026-06-24","South Korea","South Africa","A","Monterrey","21:00"),
 ("2026-06-25","Ecuador","Germany","E","New York/New Jersey","16:00"),
 ("2026-06-25","Curacao","Ivory Coast","E","Philadelphia","16:00"),
 ("2026-06-25","Tunisia","Netherlands","F","Kansas City","19:00"),
 ("2026-06-25","Japan","UEFA Playoff B","F","Dallas","19:00"),
 ("2026-06-25","United States","UEFA Playoff C","D","Los Angeles","22:00"),
 ("2026-06-25","Paraguay","Australia","D","San Francisco Bay Area","22:00"),
 ("2026-06-26","Norway","France","I","Boston","15:00"),
 ("2026-06-26","Senegal","FIFA Playoff 2","I","Toronto","15:00"),
 ("2026-06-26","New Zealand","Belgium","G","Vancouver","20:00"),
 ("2026-06-26","Egypt","Iran","G","Seattle","20:00"),
 ("2026-06-26","Uruguay","Spain","H","Guadalajara","23:00"),
 ("2026-06-26","Cape Verde","Saudi Arabia","H","Houston","13:00"),
 ("2026-06-27","Panama","England","L","New York/New Jersey","17:00"),
 ("2026-06-27","Croatia","Ghana","L","Philadelphia","17:00"),
 ("2026-06-27","Colombia","Portugal","K","Miami","19:30"),
 ("2026-06-27","FIFA Playoff 1","Uzbekistan","K","Atlanta","19:30"),
 ("2026-06-27","Jordan","Argentina","J","Dallas","22:00"),
 ("2026-06-27","Algeria","Austria","J","Kansas City","22:00"),
]

def to_utc(date_str, et):
    plus = 0
    if et.endswith("+1"):
        plus = 1; et = et[:-2]
    h, m = map(int, et.split(":"))
    d = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=plus)
    d = d.replace(hour=h, minute=m) + timedelta(hours=4)  # ET(UTC-4) -> UTC
    return d.replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

fixtures = []
for i,(date,home,away,grp,city,et) in enumerate(raw, start=1):
    fixtures.append({
        "match_id": i, "group": grp, "home_team": home, "away_team": away,
        "stadium": STADIUM.get(city, city), "city": city,
        "kickoff_utc": to_utc(date, et), "stage": "group",
        "home_score": None, "away_score": None, "status": "scheduled",
    })

with open("fixtures.json","w") as f:
    json.dump(fixtures, f, indent=2, ensure_ascii=False)
print(f"{len(fixtures)} fixtures written")
