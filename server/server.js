import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
const PORT = process.env.PORT;

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

app.get("/", (req, res) => {
  res.send("🔥 Node 서버 연결 성공!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
