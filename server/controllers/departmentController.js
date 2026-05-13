import e from "express";
import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    description,
    phone,
    branchId
  ]);

  res.json({
    success: true,
    message: "부서 추가 성공"
  });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  if (!departmentId || isNaN(departmentId)) {
    const error = new Error("유효하지 않은 부서 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM Department WHERE ID = ?",
    [departmentId]
  );

  if (rows.length === 0) {
    const error = new Error("삭제할 부서가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  await pool.execute(
    "DELETE FROM Department WHERE ID = ?",
    [departmentId]
  );

  res.json({
    success: true,
    message: "부서 삭제 성공"
  });
});

export const getDepartments = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT *
    FROM department
    ORDER BY ID DESC
    `);

  res.json({
    success: true,
    data: rows
  });
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;

  if (!departmentId || isNaN(departmentId)) {
    const error = new Error("유효하지 않은 부서 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM Department WHERE ID = ?",
    [departmentId]
  );

  if (rows.length === 0) {
    const error = new Error("부서가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: rows[0]
  });
});