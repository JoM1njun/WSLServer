import { pool } from "../db.js";

// Sensor Data Insert API (Post)
// 최신 센서 데이터 조회 API
export async function getLatestSensorData(req, res) {
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
}

// 특정 작업자의 센서 기록 조회 API
export async function getWorkerSensorData(req, res) {
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
}