import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// =======================
// Branch INSERT / DELETE
// =======================
export const insertBranch = asyncHandler(async (req, res) => {
  const {
    branchName,
    address,
    phone,
    managerName,
    companyId
  } = req.body;

  if (!branchName) {
    logger.warn("[Validation Error] 필수값 누락", {
      branchName
    });

    const error = new Error("지점명은 필수입니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      INSERT INTO Branch
      (Branch_name, Address, Phone, Manager_Name, Company_id)
      VALUES (?, ?, ?, ?, ?)
    `;

  await pool.execute(sql, [
    branchName,
    address,
    phone,
    managerName,
    companyId
  ]);

  logger.info("[DB] 지점 데이터 INSERT 완료", {
    branchName, companyId
  });

  res.json({
    success: true,
    message: "지점 추가 성공"
  });
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  if (!branchId || isNaN(branchId)) {
    logger.warn("[Validation Error] 유효하지 않은 지점 ID", {
      branchId
    });

    const error = new Error("유효하지 않은 지점 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM branch WHERE ID = ?",
    [branchId]
  );

  if (rows.length === 0) {
    logger.warn("[DB] 삭제할 지점이 존재하지 않음", {
      branchId
    });

    const error = new Error("삭제할 지점이 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  await pool.execute(
    "DELETE FROM Branch WHERE ID = ?",
    [branchId]
  );

  logger.warn("[DB] 지점 데이터 DELETE 완료", {
    branchId
  });

  res.json({
    success: true,
    message: "지점 삭제 성공"
  });
});

export const getBranches = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT * 
    FROM branch 
    ORDER BY ID DESC
    `);

  res.json({
    success: true,
    data: rows
  });
});

export const getBranchById = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  if (!branchId || isNaN(branchIdId)) {
    logger.warn("[Validation Error] 유효하지 않은 지점 ID", {
      branchId
    });

    const error = new Error("유효하지 않은 지점 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM branch WHERE ID = ?",
    [branchId]
  );

  if (rows.length === 0) {
    logger.warn("[DB] 조회할 지점이 존재하지 않음", {
      branchId
    });

    const error = new Error("지점이 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("[DB] 지점 목록 조회 완료", {
    branchId,
    count: rows.length
  });

  res.json({
    success: true,
    data: rows[0]
  });
});