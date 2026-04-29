import joblib
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

model = joblib.load("risk_model.pkl")


class SensorData(BaseModel):
    workerId: int
    heartRate: int
    temperature: float
    ecgAbnormal: bool = False
    avgHeartRate: int
    avgTemperature: float


@app.post("/predict")
def predict(data: SensorData):
    heart_diff = data.heartRate - data.avgHeartRate
    temp_diff = data.temperature - data.avgTemperature

    features = [
        [
            data.heartRate,
            data.temperature,
            int(data.ecgAbnormal),
            data.avgHeartRate,
            data.avgTemperature,
            heart_diff,
            temp_diff,
        ]
    ]

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0].max()

    return {
        "workerId": data.workerId,
        "status": prediction,
        "confidence": round(probability * 100, 2),
        "message": (
            "이상 징후가 감지되었습니다. 관리자 확인이 필요합니다."
            if prediction != "normal"
            else "정상 상태입니다."
        ),
    }
