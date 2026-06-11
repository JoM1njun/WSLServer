import express from "express";
import {
    getAlerts,
    getWorkerAlerts,
} from "../controllers/alertController.js";

const router = express.Router();

router.get("/", getAlerts);
router.get("/worker/:workerId", getWorkerAlerts);

export default router;