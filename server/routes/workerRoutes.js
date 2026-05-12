import express from "express";
import {
  insertWorker,
  deleteWorker,
  getWorkers
} from "../controllers/workerController.js";

const router = express.Router();

router.get("/", getWorkers);
router.post("/", insertWorker);
router.delete("/:workerId", deleteWorker);

export default router;