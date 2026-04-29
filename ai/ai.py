from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class SensorData(BaseModel):
    workerId: int
    heartRate: int
    temperature: float
    ecgAbnormal: bool = False


def analyze_risk(heart_rate, temperature, ecg_abnormal):
    score = 0

    if heart_rate >= 120:
        score += 35
    elif heart_rate >= 100:
        score += 20

    if temperature >= 38.0:
        score += 40
    elif temperature >= 37.5:
        score += 20

    if ecg_abnormal:
        score += 30

    if score >= 70:
        status = "danger"
    elif score >= 40:
        status = "caution"
    else:
        status = "normal"

    return status, score


@app.post("/predict")
def predict(data: SensorData):
    status, score = analyze_risk(data.heartRate, data.temperature, data.ecgAbnormal)

    return {
        "workerId": data.workerId,
        "status": status,
        "riskScore": score,
        "message": (
            "이상 징후가 감지되었습니다. 관리자 확인이 필요합니다."
            if status != "normal"
            else "정상 상태입니다."
        ),
    }
