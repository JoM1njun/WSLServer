import express from "express";
import {
  insertHelmet,
  deleteHelmet,
  getHelmets
} from "../controllers/helmetController.js";

const router = express.Router();

router.get("/", getHelmets);
router.post("/", insertHelmet);
router.delete("/:helmetId", deleteHelmet);

export default router;