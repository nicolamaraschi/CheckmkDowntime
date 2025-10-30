import requests
import os
import json

host = os.environ.get("CHECKMK_HOST", "monitor-horsarun.horsa.it")
site = os.environ.get("CHECKMK_SITE", "mkhrun")
user = os.environ.get("CHECKMK_USER", "demousera")
password = os.environ.get("CHECKMK_PASSWORD")

api_url = f"https://{host}/{site}/check_mk/api/1.0"

session = requests.session()
session.headers['Authorization'] = f"Bearer {user} {password}"
session.headers['Accept'] = 'application/json'

print("Tentativo di recuperare i downtime esistenti...")
try:
    response = session.get(f"{api_url}/domain-types/downtime/collections/host")
    
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Numero di downtime trovati: {len(data.get('value', []))}")
        
        if data.get('value') and len(data.get('value')) > 0:
            print("\nPrimo downtime (esempio):")
            print(json.dumps(data['value'][0], indent=2))
        else:
            print("Nessun downtime trovato.")
    else:
        print(f"Errore: {response.text}")

except Exception as e:
    print(f"Errore durante la richiesta: {str(e)}")

print("\n\n=== Test completato ===")
