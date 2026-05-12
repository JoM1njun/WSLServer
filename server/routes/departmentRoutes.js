import express from "express";
import {
  insertDepartment,
  deleteDepartment,
  getDepartments
} from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", getDepartments);
router.post("/", insertDepartment);
router.delete("/:departmentId", deleteDepartment);

export default router;