import { pool } from "../db.js";

// =======================
// Worker INSERT / UPDATE / DELETE
// =======================

// 작업자 추가 INSERT
export async function insertWorker(req, res) {
  try {
    const {
      id,
      name,
      birthDate,
      gender,
      position,
      bloodType,
      emergencyContact,
      disease,
      departmentId
    } = req.body;

    const sql = `
      INSERT INTO Worker
      (ID, Name, Birth_date, Gender, Position, Blood_type, Emergency_contact, Disease, Department_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(sql, [
      id,
      name,
      birthDate,
      gender,
      position,
      bloodType,
      emergencyContact,
      disease,
      departmentId
    ]);

    res.json({
      success: true,
      message: "작업자 추가 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "작업자 추가 실패"
    });
  }
}

// 작업자 수정 UPDATE
export async function updateWorker(req, res) {
  try {
    const { workerId } = req.params;

    const {
      name,
      birthDate,
      gender,
      position,
      bloodType,
      emergencyContact,
      disease,
      departmentId
    } = req.body;

    const sql = `
      UPDATE Worker
      SET
        Name = ?,
        Birth_date = ?,
        Gender = ?,
        Position = ?,
        Blood_type = ?,
        Emergency_contact = ?,
        Disease = ?,
        Department_id = ?
      WHERE ID = ?
    `;

    await pool.execute(sql, [
      name,
      birthDate,
      gender,
      position,
      bloodType,
      emergencyContact,
      disease,
      departmentId,
      workerId
    ]);

    res.json({
      success: true,
      message: "작업자 수정 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "작업자 수정 실패"
    });
  }
}

// 작업자 삭제 DELETE
export async function deleteWorker(req, res) {
  try {
    const { workerId } = req.params;

    const sql = `
      DELETE FROM Worker
      WHERE ID = ?
    `;

    await pool.execute(sql, [workerId]);

    res.json({
      success: true,
      message: "작업자 삭제 성공"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "작업자 삭제 실패"
    });
  }
}

export async function getWorkers(req, res) {
  try {
    const sql = `
      SELECT
        w.ID AS workerId,
        w.Name AS workerName,
        TIMESTAMPDIFF(YEAR, w.Birth_date, CURDATE()) AS age,
        w.Gender,
        w.Position,
        w.Blood_type,
        w.Emergency_contact,
        w.Disease,
        d.Department_Name AS departmentName,
        b.Branch_name AS branchName,
        c.Company_Name AS companyName
      FROM Worker w
      JOIN Department d ON w.Department_id = d.ID
      JOIN Branch b ON d.Branch_id = b.ID
      JOIN Company c ON b.Company_id = c.ID
      ORDER BY w.ID DESC
    `;

    const [rows] = await pool.execute(sql);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "작업자 목록 조회 실패"
    });
  }
}