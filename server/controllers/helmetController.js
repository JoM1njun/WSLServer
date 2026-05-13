import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// =======================
// Helmet INSERT / DELETE
// =======================
export const insertHelmet = asyncHandler(async (req, res) => {
  const {
    helmetName,
    departmentId
  } = req.body;

  const sql = `
      INSERT INTO Helmet
      (Helmet_Name, Department_id)
      VALUES (?, ?)
    `;

  await pool.execute(sql, [
    helmetName,
    departmentId
  ]);

  res.json({
    success: true,
    message: "헬멧 추가 성공"
  });
});

export const deleteHelmet = asyncHandler(async (req, res) => {
  const { helmetId } = req.params;

  if (!helmetId || isNaN(helmetId)) {
    const error = new Error("유효하지 않은 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  await pool.execute(
    "DELETE FROM Helmet WHERE ID = ?",
    [helmetId]
  );

  res.json({
    success: true,
    message: "헬멧 삭제 성공"
  });
});

export const getHelmets = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT *
    FROM helmet
    ORDER BY ID DESC
  `);

  res.json({
    success: true,
    data: rows
  });
});

export const getHelmetById = asyncHandler(async (req, res) => {
  const { helmetId } = req.params;

  if (!helmetId || isNaN(helmetId)) {
    const error = new Error("유효하지 않은 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM helmet WHERE ID = ?",
    [helmetId]
  );

  if (rows.length === 0) {
    const error = new Error("존재하지 않는 헬멧입니다.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: rows[0]
  });
});