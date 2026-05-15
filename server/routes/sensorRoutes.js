import express from "express";
import {
  insertSensorData,
  getLatestSensorData,
  getWorkerSensorData
} from "../controllers/sensorController.js";

const router = express.Router();

// 센서 데이터 저장 + 최신 센서 데이터 갱신 + Alert 생성
router.post("/", insertSensorData);

// 특정 작업자 + 헬멧의 최신 센서 데이터 조회
router.get("/:workerId/:helmetId", getLatestSensorData);

// 특정 작업자의 센서 기록 조회
router.get("/workers/:workerId", getWorkerSensorData);

export default router;