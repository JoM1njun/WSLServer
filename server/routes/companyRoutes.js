import express from "express";
import {
  insertCompany,
  deleteCompany,
  getCompanies
} from "../controllers/companyController.js";

const router = express.Router();

router.post("/", insertCompany);
router.delete("/:companyId", deleteCompany);
router.get("/", getCompanies);

export default router;
