import e from "express";
import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// =======================
// Department INSERT / DELETE
// =======================
export const insertDepartment = asyncHandler(async (req, res) => {
  const {
    departmentName,
    description,
    phone,
    branchId
  } = req.body;

  if (!departmentName) {
    logger.warn("[Validation Error] 필수값 누락", {
      departmentName
    });

    const error = new Error("부서명은 필수입니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      INSERT INTO Department
      (Department_Name, Description, Phone, Branch_id)
      VALUES (?, ?, ?, ?)
    `;

  await pool.execute(sql, [
    departmentName,
    description ?? null,
    phone ?? null,
    branchId
  ]);

  logger.info("[DB] 부서 데이터 INSERT 완료", {
    departmentName, branchId
  });

  res.json({
    success: true,
    message: "부서 추가 성공"
  });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  if (!departmentId || isNaN(departmentId)) {
    logger.warn("[Validation Error] 유효하지 않은 부서 ID", {
      departmentId
    });
    const error = new Error("유효하지 않은 부서 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM Department WHERE ID = ?",
    [departmentId]
  );

  if (rows.length === 0) {
    logger.warn("[DB] 삭제할 부서가 존재하지 않음", {
      departmentId
    });

    const error = new Error("삭제할 부서가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  await pool.execute(
    "DELETE FROM Department WHERE ID = ?",
    [departmentId]
  );

  logger.warn("[DB] 부서 데이터 DELETE 완료", {
    departmentId
  });

  res.json({
    success: true,
    message: "부서 삭제 성공"
  });
});

// Department List Select API
export const getDepartments = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT *
    FROM department
    ORDER BY ID DESC
    `);

  logger.info("[DB] 부서 목록 조회 완료", {
    count: rows.length
  });

  res.json({
    success: true,
    data: rows
  });
});

// Department Detail Select API
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  if (!departmentId || isNaN(departmentId)) {
    logger.warn("[Validation Error] 유효하지 않은 부서 ID", {
      departmentId
    });

    const error = new Error("유효하지 않은 부서 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM Department WHERE ID = ?",
    [departmentId]
  );

  if (rows.length === 0) {
    logger.warn("[DB] 조회할 부서가 존재하지 않음", {
      departmentId
    });

    const error = new Error("부서가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("[DB] 부서 상세 조회 완료", {
    departmentId,
    count: rows.length
  });

  res.json({
    success: true,
    data: rows[0]
  });
});