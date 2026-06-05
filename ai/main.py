import os
import logging
from datetime import datetime, timezone, timedelta

import joblib
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# =========================
# Logger 설정
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

logger = logging.getLogger(__name__)

KST = timezone(timedelta(hours=9))

app = FastAPI()

SERVER_STARTED_AT = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")

# =========================
# 서버 시작 로그
# =========================
logger.info("===================================")
logger.info("[AI Server] 서버 시작")
logger.info(f"[AI Server] Started At: {SERVER_STARTED_AT}")
logger.info(f"[AI Server] Current Directory: {os.getcwd()}")
logger.info(f"[AI Server] Files: {os.listdir()}")
logger.info("===================================")

# =========================
# 모델 로드
# =========================
try:
    model = joblib.load("risk_model.pkl")
    logger.info("[AI Model] risk_model.pkl 로드 성공")
except Exception as e:
    logger.exception("[AI Model Error] risk_model.pkl 로드 실패")
    raise e

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
    ecgAbnormal: bool
    avgHeartRate: float
    avgTemperature: float
    measuredAt: str | None = None


STATUS_SAFE = 1
STATUS_WARNING = 2
STATUS_DANGER = 3

STATUS_LABELS = {
    STATUS_SAFE: "safe",
    STATUS_WARNING: "warning",
    STATUS_DANGER: "danger",
}


# =========================
# 전체 예외 처리
# =========================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"[Server Error] 요청 처리 중 오류 발생: {request.url}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "AI 서버 내부 오류가 발생했습니다.",
            "error": str(exc),
        },
    )


# =========================
# 서버 상태 확인 API
# =========================
@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI server is running",
        "startedAt": SERVER_STARTED_AT,
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
        "serverStartedAt": SERVER_STARTED_AT,
        "modelLoaded": model is not None,
    }


@app.post("/predict")
def predict(data: SensorData):
    try:
        logger.info("[Predict] AI 예측 요청 수신")
        logger.info(
            f"[Predict Data] workerId={data.workerId}, "
            f"helmetId={data.helmetId}, "
            f"heartRate={data.heartRate}, "
            f"temperature={data.temperature}, "
            f"ecgAbnormal={data.ecgAbnormal}"
        )

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

        prediction = int(model.predict(features)[0])

        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(features)[0].max()
        else:
            probability = 1.0

        result = {
            "workerId": data.workerId,
            "helmetId": data.helmetId,
            "riskLevel": prediction,
            "riskStatus": STATUS_LABELS.get(prediction, "unknown"),
            "confidence": round(probability * 100, 2),
            "message": (
                "위험 상태입니다. 즉시 확인이 필요합니다."
                if prediction == STATUS_DANGER
                else (
                    "이상 징후가 감지되었습니다. 관리자 확인이 필요합니다."
                    if prediction == STATUS_WARNING
                    else "정상 상태입니다."
                )
            ),
        }

        logger.info(f"[Predict Result] {result}")

        return result

    except Exception as e:
        logger.exception("[Predict Error] AI 예측 중 오류 발생")
        raise e
