import { pool } from "../db.js";

// =======================
// Company, Branch, Department, Helmet Data Insert & Delete API
// =======================
// Company Data Insert API

export async function insertCompany(req, res) {
  try {
    const { id, companyName, address, phone } = req.body;

    const sql = `
      INSERT INTO company
      (ID, Company_Name, Address, Phone)
      VALUES (?, ?, ?, ?)
    `;

    await pool.execute(sql, [id, companyName, address, phone]);

    res.json({
      success: true,
      message: "회사 정보 추가 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "회사 정보 추가 실패"
    });
  }
}

export async function deleteCompany(req, res) {
  try {
    const { companyId } = req.params;

    await pool.execute(
      "DELETE FROM company WHERE ID = ?",
      [companyId]
    );

    res.json({
      success: true,
      message: "회사 삭제 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "회사 삭제 실패"
    });
  }
}

export async function getCompanies(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT *
      FROM company
      ORDER BY ID DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "회사 목록 조회 실패"
    });
  }
}