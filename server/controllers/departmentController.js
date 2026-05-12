import {pool} from "../db.js";

// =======================
// Department INSERT / DELETE
// =======================
export async function insertDepartment(req, res) {
  try {
    const {
      id,
      departmentName,
      description,
      phone,
      branchId
    } = req.body;

    const sql = `
      INSERT INTO Department
      (ID, Department_Name, Description, Phone, Branch_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.execute(sql, [
      id,
      departmentName,
      description,
      phone,
      branchId
    ]);

    res.json({
      success: true,
      message: "부서 추가 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "부서 추가 실패"
    });
  }
}

export async function deleteDepartment(req, res) {
  try {
    const { departmentId } = req.params;

    await pool.execute(
      "DELETE FROM Department WHERE ID = ?",
      [departmentId]
    );

    res.json({
      success: true,
      message: "부서 삭제 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "부서 삭제 실패"
    });
  }
}

export async function getDepartments(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT *
      FROM department
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
      message: "부서 목록 조회 실패"
    });
  }
}