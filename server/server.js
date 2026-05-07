import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 작업자, 부서, 지점, 회사 DB 조회 API
app.get("/api/workers", async (req, res) => {
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
});

// 최신 센서 데이터 조회 API
app.get("/api/sensors/latest", async (req, res) => {
  try {
    const sql = `
      SELECT
        s.ID AS sensorId,
        s.Worker_id AS workerId,
        w.Name AS workerName,
        s.Temperature,
        s.Heart_rate,
        s.ECG_value,
        s.Status,
        s.Measured_at
      FROM Sensor s
      JOIN Worker w ON s.Worker_id = w.ID
      INNER JOIN (
        SELECT Worker_id, MAX(Measured_at) AS latestTime
        FROM Sensor
        GROUP BY Worker_id
      ) latest
      ON s.Worker_id = latest.Worker_id
      AND s.Measured_at = latest.latestTime
      ORDER BY s.Measured_at DESC
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
      message: "최신 센서 데이터 조회 실패"
    });
  }
});

// 특정 작업자의 센서 기록 조회 API
app.get("/api/workers/:workerId/sensors", async (req, res) => {
  try {
    const { workerId } = req.params;

    const sql = `
      SELECT
        ID AS sensorId,
        Temperature,
        Heart_rate,
        ECG_value,
        Status,
        Measured_at
      FROM Sensor
      WHERE Worker_id = ?
      ORDER BY Measured_at DESC
      LIMIT 100
    `;

    const [rows] = await pool.execute(sql, [workerId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "센서 기록 조회 실패"
    });
  }
});

// Create API (Post)
// Update API (Patch)
// Delete API (Delete)
// Sensor Data Insert API (Post)

// 작업자 추가 INSERT
app.post("/api/workers", async (req, res) => {
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
});

// 작업자 수정 UPDATE
app.put("/api/workers/:workerId", async (req, res) => {
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
});

// 작업자 삭제 DELETE
app.delete("/api/workers/:workerId", async (req, res) => {
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
});

app.get("/", (req, res) => {
  res.send("🔥 Node 서버 연결 성공!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Company Data Insert & Delete Test Code
app.post("/api/company", async (req, res) => {
  try {
    const {
      id,
      companyName,
      address,
      phone,
      createdAt,
      updatedAt
    } = req.body;

    const sql =
      'INSERT INTO company (ID, Company_Name, Address, Phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)';

    await pool.execute(sql, [
      id,
      companyName,
      address,
      phone,
      createdAt,
      updatedAt
    ])
    res.json({
      success: true,
      message: "회사 정보 추가 성공"
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "회사 정보 추가 실패"
    });
  }
});

app.delete("/api/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const sql = `
      DELETE FROM company
      WHERE ID = ?
    `;

    await pool.execute(sql, [companyId]);

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
});
