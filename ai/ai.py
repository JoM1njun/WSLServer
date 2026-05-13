import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

model = joblib.load("risk_model.pkl")

feature_columns = [
    "heartRate",
    "temperature",
    "ecgAbnormal",
    "avgHeartRate",
    "avgTemperature",
    "heartDiff",
    "tempDiff",
]


class SensorData(BaseModel):
    workerId: int
    helmetId: int
    heartRate: int
    temperature: float
    ecgAbnormal: bool = False
    avgHeartRate: int = 75
    avgTemperature: float = 36.5
    measuredAt: str | None = None


STATUS_SAFE = 1
STATUS_WARNING = 2
STATUS_DANGER = 3


@app.post("/predict")
def predict(data: SensorData):
    heart_diff = data.heartRate - data.avgHeartRate
    temp_diff = data.temperature - data.avgTemperature

    features = pd.DataFrame(
        [
            {
                "heartRate": data.heartRate,
                "temperature": data.temperature,
                "ecgAbnormal": int(data.ecgAbnormal),
                "avgHeartRate": data.avgHeartRate,
                "avgTemperature": data.avgTemperature,
                "heartDiff": heart_diff,
                "tempDiff": temp_diff,
            }
        ],
        columns=feature_columns,
    )

    STATUS_LABELS = {
        STATUS_SAFE: "safe",
        STATUS_WARNING: "warning",
        STATUS_DANGER: "danger",
    }

    prediction = int(model.predict(features)[0])
    probability = model.predict_proba(features)[0].max()

    return {
        "workerId": data.workerId,
        "helmetId": data.helmetId,
        "statusCode": prediction,
        "status": STATUS_LABELS[prediction],
        "confidence": round(probability * 100, 2),
        "message": (
            "이상 징후가 감지되었습니다. 관리자 확인이 필요합니다."
            if prediction != STATUS_SAFE
            else "정상 상태입니다."
        ),
    }
