import os
from datetime import datetime, timezone

from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify({"service": "HQ", "message": "Server time service"})


@app.route("/time")
def time():
    now = datetime.now(timezone.utc)
    return jsonify(
        {
            "iso": now.isoformat(),
            "unix": int(now.timestamp()),
            "utc": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))