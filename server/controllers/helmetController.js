import {pool} from "../db.js";

// =======================
// Helmet INSERT / DELETE
// =======================
export async function insertHelmet(req, res) {
  try {
    const {
      id,
      helmetName,
      departmentId
    } = req.body;

    const sql = `
      INSERT INTO Helmet
      (ID, Helmet_Name, Department_id)
      VALUES (?, ?, ?)
    `;

    await pool.execute(sql, [
      id,
      helmetName,
      departmentId
    ]);

    res.json({
      success: true,
      message: "헬멧 추가 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "헬멧 추가 실패"
    });
  }
}

export async function deleteHelmet(req, res) {
  try {
    const { helmetId } = req.params;

    await pool.execute(
      "DELETE FROM Helmet WHERE ID = ?",
      [helmetId]
    );

    res.json({
      success: true,
      message: "헬멧 삭제 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "헬멧 삭제 실패"
    });
  }
}

export async function getHelmets(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT *
      FROM helmet
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
      message: "헬멧 목록 조회 실패"
    });
  }
}