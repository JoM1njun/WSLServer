import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// =======================
// Company, Branch, Department, Helmet Data Insert & Delete API
// =======================
// Company Data Insert API

export const insertCompany = asyncHandler(async (req, res) => {
  const { companyName, address, phone } = req.body;

  if (!companyName) {
    logger.warn("[Validation Error] 필수값 누락", {
      companyName
    });

    const error = new Error("회사명은 필수입니다.");
    error.statusCode = 400;
    throw error;
  }

  const phoneRegex = /^010-\d{4}-\d{4}$/;

  if (!phoneRegex.test(phone)) {
    logger.warn("[Validation Error] 전화번호 형식 오류", {
      phone
    });

    const error = new Error("전화번호 형식이 올바르지 않습니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      INSERT INTO company
      (Company_Name, Address, Phone)
      VALUES (?, ?, ?)
    `;

  await pool.execute(sql, [companyName, address, phone]);

  logger.info("[DB] 회사 데이터 INSERT 완료", {
    companyName
  });

  res.json({
    success: true,
    message: "회사 정보 추가 성공"
  });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!companyId || isNaN(companyId)) {
    logger.warn("[Validation Error] 유효하지 않은 회사 ID", {
      companyId
    });

    const error = new Error("유효하지 않은 회사 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT id FROM company WHERE id = ?",
    [companyId]
  );

  if (rows.length === 0) {
    logger.warn("[Validation Error] 삭제할 회사가 존재하지 않음.", {
      companyId
    });

    const error = new Error("삭제할 회사가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  await pool.execute(
    "DELETE FROM company WHERE ID = ?",
    [companyId]
  )

  logger.warn("[DB] 회사 데이터 DELETE 완료", {
    companyId
  });

  res.json({
    success: true,
    message: "회사 삭제 성공"
  });
});

export const getCompanies = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT *
    FROM company
    ORDER BY ID DESC
  `);

  logger.info("[DB] 회사 목록 조회 완료", {
    count: rows.length
  });

  res.json({
    success: true,
    data: rows
  });
});

export const getCompanyById = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!companyId || isNaN(companyId)) {
    logger.warn("[Validation Error] 유효하지 않은 회사 ID", {
      companyId
    });

    const error = new Error("유효하지 않은 회사 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM company WHERE ID = ?",
    [companyId]
  );

  if (rows.length === 0) {
    logger.warn("[Validation Error] 조회할 회사가 존재하지 않음.", {
      companyId
    });

    const error = new Error("회사가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("[DB] 회사 목록 조회 완료", {
    companyId,
    count: rows.length
  });

  res.json({
    success: true,
    data: rows[0]
  });
});