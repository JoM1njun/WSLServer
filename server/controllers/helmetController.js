import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// =======================
// Helmet INSERT / DELETE
// =======================

// Helmet Insert API
export const insertHelmet = asyncHandler(async (req, res) => {
  const {
    helmetName,
    departmentId
  } = req.body;

  if (!helmetName || !departmentId || isNaN(departmentId)) {
    logger.warn("[Validation Error] 필수값 누락 또는 유효하지 않은 값", {
      helmetName,
      departmentId
    });

    const error = new Error("헬멧 이름과 유효한 부서 ID는 필수입니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      INSERT INTO Helmet
      (Helmet_Name, Department_id)
      VALUES (?, ?)
    `;

  await pool.execute(sql, [
    helmetName,
    departmentId
  ]);

  logger.info("[DB] 헬멧 데이터 INSERT 완료", {
    helmetName, departmentId
  });

  res.json({
    success: true,
    message: "헬멧 추가 성공"
  });
});

// Delete Helmet API
export const deleteHelmet = asyncHandler(async (req, res) => {
  const { helmetId } = req.params;

  if (!helmetId || isNaN(helmetId)) {
    logger.warn("[Validation Error] 유효하지 않은 헬멧 ID", {
      helmetId
    });

    const error = new Error("유효하지 않은 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  await pool.execute(
    "DELETE FROM Helmet WHERE ID = ?",
    [helmetId]
  );

  logger.warn("[DB] 헬멧 데이터 DELETE 완료", {
    helmetId
  });

  res.json({
    success: true,
    message: "헬멧 삭제 성공"
  });
});

// Helme List Select API
export const getHelmets = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT *
    FROM helmet
    ORDER BY ID DESC
  `);

  logger.info("[DB] 헬멧 목록 조회 완료", {
    count: rows.length
  });

  res.json({
    success: true,
    data: rows
  });
});

// Helmet Detail Select API
export const getHelmetById = asyncHandler(async (req, res) => {
  const { helmetId } = req.params;

  if (!helmetId || isNaN(helmetId)) {
    logger.warn("[Validation Error] 유효하지 않은 헬멧 ID", {
      helmetId
    });

    const error = new Error("유효하지 않은 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM helmet WHERE ID = ?",
    [helmetId]
  );

  if (rows.length === 0) {
    logger.warn("[Not Found] 존재하지 않는 헬멧 조회 시도", {
      helmetId
    });

    const error = new Error("존재하지 않는 헬멧입니다.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("[DB] 헬멧 상세 정보 조회 완료", {
    helmetId
  });

  res.json({
    success: true,
    data: rows[0]
  });
});