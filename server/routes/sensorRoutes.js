import express from "express";
import {
  insertSensor,
  deleteSensor,
  getSensors
} from "../controllers/sensorController.js";

const router = express.Router();

router.get("/", getSensors);
router.post("/", insertSensor);
router.delete("/:sensorId", deleteSensor);

export default router;