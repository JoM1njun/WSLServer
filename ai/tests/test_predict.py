import csv
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_predict():
    with open("sensor_data.csv", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            response = client.post(
                "/predict",
                json={
                    "workerId": 1,
                    "helmetId": 1,
                    "heartRate": int(row["heartRate"]),
                    "temperature": float(row["temperature"]),
                    "ecgAbnormal": bool(int(row["ecgAbnormal"])),
                    "avgHeartRate": float(row["avgHeartRate"]),
                    "avgTemperature": float(row["avgTemperature"]),
                },
            )

            assert response.status_code == 200

            result = response.json()

            assert "riskLevel" in result
            assert "riskStatus" in result
            assert "confidence" in result

            assert result["riskLevel"] == int(row["status"])