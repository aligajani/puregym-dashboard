from puregym_attendance import PuregymAPIClient
from datetime import datetime, timezone

EMAIL = "aligajani@gmail.com"
PIN = "03344875"

client = PuregymAPIClient(email=EMAIL, pin=PIN)

gym = client.get_home_gym()
sessions = client.session.get(
    f'https://capi.puregym.com/api/v2/gymSessions/gym?gymId={client.home_gym_id}',
    headers=client.headers
).json()

# The library's get_member_activity() is broken — it needs date params
history = client.session.get(
    'https://capi.puregym.com/api/v2/gymSessions/member?fromDate=2020-01-01T00:00:00&toDate=2030-01-01T00:00:00',
    headers=client.headers
).json()

print(f"Gym:               {gym['Name']} ({gym['Status']})")
print(f"People in gym:     {sessions['TotalPeopleInGym']}")
print(f"People in classes: {sessions['TotalPeopleInClasses']}")
print(f"Max capacity:      {sessions['MaximumCapacity']}")
print(f"Last refreshed:    {sessions['LastRefreshed']}")
print()

summary = history['Summary']['Total']
print(f"Total visits:      {summary['Visits']}")
print(f"Total duration:    {summary['Duration']} mins")
print()

print("Visit history:")
for v in history['Visits']:
    dt = datetime.fromisoformat(v['StartTime'])
    print(f"  {dt.strftime('%d %b %Y %H:%M')}  —  {v['Duration']} mins  ({v['Gym']['Name']})")
