import csv

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_predict():
    with open("data/test_data.csv", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            response = client.post(
                "/predict",
                json={
                    "workerId": int(row["workerId"]),
                    "helmetId": int(row["helmetId"]),
                    "heartRate": int(row["heartRate"]),
                    "temperature": float(row["temperature"]),
                    "ecgAbnormal": row["ecgAbnormal"].lower() == "true",
                    "avgHeartRate": float(row["avgHeartRate"]),
                    "avgTemperature": float(row["avgTemperature"]),
                },
            )

            assert response.status_code == 200

            result = response.json()

            assert "riskLevel" in result
            assert "riskStatus" in result
            assert "confidence" in result

            assert result["riskLevel"] == int(row["riskLevel"])