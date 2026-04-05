from flask import Flask, jsonify, render_template
from puregym_attendance import PuregymAPIClient

EMAIL = "aligajani@gmail.com"
PIN = "03344875"

app = Flask(__name__)


def get_client():
    client = PuregymAPIClient(email=EMAIL, pin=PIN)
    client.get_home_gym()
    return client


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/data")
def data():
    client = get_client()

    membership = client.session.get(
        "https://capi.puregym.com/api/v2/member/membership",
        headers=client.headers
    ).json()

    sessions = client.session.get(
        f"https://capi.puregym.com/api/v2/gymSessions/gym?gymId={client.home_gym_id}",
        headers=client.headers
    ).json()

    history = client.session.get(
        "https://capi.puregym.com/api/v2/gymSessions/member"
        "?fromDate=2020-01-01T00:00:00&toDate=2030-01-01T00:00:00",
        headers=client.headers
    ).json()

    member = client.session.get(
        "https://capi.puregym.com/api/v2/member",
        headers=client.headers
    ).json()

    return jsonify({
        "member": member,
        "membership": membership,
        "sessions": sessions,
        "history": history,
    })


if __name__ == "__main__":
    app.run(debug=True, port=8080)
