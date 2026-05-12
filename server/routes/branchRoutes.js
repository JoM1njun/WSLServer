import express from "express";
import {
  insertBranch,
  deleteBranch,
  getBranches
} from "../controllers/branchController.js";

const router = express.Router();

router.get("/", getBranches);
router.post("/", insertBranch);
router.delete("/:branchId", deleteBranch);

export default router;