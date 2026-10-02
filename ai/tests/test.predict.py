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
                    "heartRate": float(row["heartRate"]),
                    "temperature": float(row["temperature"]),
                    "ecgValue": float(row["ecgValue"])
                }
            )

            assert response.status_code == 200
            assert "risk" in response.json()
            assert response.json()["risk"] == int(row["risk"])