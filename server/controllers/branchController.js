import { pool } from "../db.js";

// =======================
// Branch INSERT / DELETE
// =======================
export async function insertBranch (req, res) {
  try {
    const {
      id,
      branchName,
      address,
      phone,
      managerName,
      companyId
    } = req.body;

    const sql = `
      INSERT INTO Branch
      (ID, Branch_name, Address, Phone, Manager_Name, Company_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(sql, [
      id,
      branchName,
      address,
      phone,
      managerName,
      companyId
    ]);

    res.json({
      success: true,
      message: "지점 추가 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "지점 추가 실패"
    });
  }
}

export async function deleteBranch (req, res) {
  try {
    const { branchId } = req.params;

    await pool.execute(
      "DELETE FROM Branch WHERE ID = ?",
      [branchId]
    );

    res.json({
      success: true,
      message: "지점 삭제 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "지점 삭제 실패"
    });
  }
}

export async function getBranches(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT *
      FROM branch
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
      message: "지점 목록 조회 실패"
    });
  }
}