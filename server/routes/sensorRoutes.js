import express from "express";
import {
  getLatestSensorData,
  getWorkerSensorData
} from "../controllers/sensorController.js";

const router = express.Router();

router.get("/", getLatestSensorData);
router.get("/workers/:workerId", getWorkerSensorData);

export default router;