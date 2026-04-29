import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

data = pd.read_csv("sensor_data.csv")

X = data[
    [
        "heartRate",
        "temperature",
        "ecgAbnormal",
        "avgHeartRate",
        "avgTemperature",
        "heartDiff",
        "tempDiff",
    ]
]

y = data["status"]

model = RandomForestClassifier()
model.fit(X, y)

joblib.dump(model, "risk_model.pkl")
