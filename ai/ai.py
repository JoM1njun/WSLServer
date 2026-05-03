import joblib
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

model = joblib.load("risk_model.pkl")


class SensorData(BaseModel):
    workerId: int
    helmetId: int
    heartRate: int
    temperature: float
    ecgAbnormal: bool = False
    measuredAt: str | None = None


@app.post("/predict")
def predict(data: SensorData):
    baseline = get_worker_baseline(data.workerId)

    heart_diff = data.heartRate - baseline.avg_heart_rate
    temp_diff = data.temperature - baseline.avg_temperature

    features = [[
        data.heartRate,
        data.temperature,
        int(data.ecgAbnormal),
        baseline.avg_heart_rate,
        baseline.avg_temperature,
        heart_diff,
        temp_diff,
    ]]

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0].max()

    save_sensor_log(
        worker_id=data.workerId,
        helmet_id=data.helmetId,
        temperature=data.temperature,
        heart_rate=data.heartRate,
        status=prediction
    )

    if prediction != "normal":
        create_alert(data.workerId, data.helmetId, prediction)

    return {
        "workerId": data.workerId,
        "helmetId": data.helmetId,
        "status": prediction,
        "confidence": round(probability * 100, 2),
        "message": (
            "이상 징후가 감지되었습니다. 관리자 확인이 필요합니다."
            if prediction != "normal"
            else "정상 상태입니다."
        ),
    }

def get_worker_baseline(worker_id: int):
    class Baseline:
        avg_heart_rate = 75
        avg_temperature = 36.5

    return Baseline()

def save_sensor_log(worker_id, helmet_id, temperature, heart_rate, status):
    print("센서기록 저장:", worker_id, helmet_id, temperature, heart_rate, status)


def create_alert(worker_id, helmet_id, status):
    print("알림 생성:", worker_id, helmet_id, status)
