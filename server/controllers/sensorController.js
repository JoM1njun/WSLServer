import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// Sensor Data Insert API (Post)
// AI 서버와 연동하여 센서 데이터 저장 및 위험 상태 알림 생성
export const insertSensorData = asyncHandler(async (req, res) => {
  const {
    workerId,
    helmetId,
    temperature,
    heartRate,
    ecgValue,
  } = req.body;

  if (!workerId || isNaN(workerId) || !helmetId || isNaN(helmetId)) {
    logger.warn("[Validation Error] 유효하지 않은 작업자 ID 또는 헬멧 ID", {
      workerId,
      helmetId,
    });

    const error = new Error("유효하지 않은 작업자 ID 또는 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  if (heartRate == null || temperature == null) {
    logger.warn("[Validation Error] 센서값 누락", {
      heartRate,
      temperature,
    });

    const error = new Error("심박수와 체온은 필수입니다.");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.AI_SERVER_URL) {
    const error = new Error("AI_SERVER_URL 환경변수가 설정되지 않았습니다.");
    error.statusCode = 500;
    throw error;
  }

  // 이전 상태 조회
  const [currentRows] = await pool.execute(
    `
  SELECT status
  FROM current_sensor_status
  WHERE worker_id = ? AND helmet_id = ?
  `,
    [workerId, helmetId]
  );

  const previousStatus = currentRows[0]?.status;

  logger.info("[DB] 이전 센서 상태 조회 완료", {
    previousStatus: previousStatus ?? "기존 상태 없음",
  });

  // 평균 센서값 조회
  const [avgRows] = await pool.execute(
    `
  SELECT
    AVG(Heart_rate) AS avgHeartRate,
    AVG(Temperature) AS avgTemperature
  FROM Sensor
  WHERE Worker_id = ?
  `,
    [workerId]
  );

  const avgHeartRate = Number(avgRows[0]?.avgHeartRate ?? heartRate);
  const avgTemperature = Number(avgRows[0]?.avgTemperature ?? temperature);

  logger.info("[DB] 평균 센서값 조회 완료", {
    avgHeartRate,
    avgTemperature,
  });

  // AI 서버 요청
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);

  let aiResponse;

  // AI 서버 연결
  // 추후 AI 모델 서버 URL로 변경 필요
  try {
    aiResponse = await fetch(`${process.env.AI_SERVER_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        workerId: Number(workerId),
        helmetId: Number(helmetId),
        heartRate: Number(heartRate),
        temperature: Number(temperature),
        ecgAbnormal: Boolean(ecgValue),
        avgHeartRate,
        avgTemperature,
      })
    });
  } catch (error) {
    logger.error("[AI Error] AI 서버 요청 실패", {
      message: error.message,
    });

    const err = new Error("AI 서버 요청 실패");
    err.statusCode = 502;
    throw err;
  } finally {

    clearTimeout(timeout);
  }

  console.log("[AI] AI 서버 응답 수신", {
    statusCode: aiResponse.status,
    ok: aiResponse.ok,
  });

  if (!aiResponse.ok) {
    logger.error("[AI Error] AI 서버 예측 요청 실패", {
      statusCode: aiResponse.status,
    });

    const error = new Error("AI 서버 예측 요청 실패");
    error.statusCode = 502;
    throw error;
  }

  const aiResult = await aiResponse.json();

  logger.info("[AI Result]", aiResult);

  // 센서 데이터 업데이트 (최신화)
  const [dbInfo] = await pool.execute(`
  SELECT DATABASE() AS dbName, NOW() AS dbNow
`);

  logger.info("[DB 연결 확인]", dbInfo[0]);

  const [statusResult] = await pool.execute(
    `
  INSERT INTO current_sensor_status
  (worker_id, helmet_id, heart_rate, temperature, ecg_abnormal, status, confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    helmet_id = VALUES(helmet_id),
    heart_rate = VALUES(heart_rate),
    temperature = VALUES(temperature),
    ecg_abnormal = VALUES(ecg_abnormal),
    status = VALUES(status),
    confidence = VALUES(confidence),
    updated_at = CURRENT_TIMESTAMP
  `,
    [
      workerId,
      helmetId,
      heartRate,
      temperature,
      ecgValue ? 1 : 0,
      aiResult.riskStatus,
      aiResult.confidence
    ]
  );

  logger.info("[DB] current_sensor_status 저장 결과", {
    affectedRows: statusResult.affectedRows,
    insertId: statusResult.insertId,
    changedRows: statusResult.changedRows,
  });

  // 데이터 위험 시 Sensor Log 저장
  if (aiResult.riskLevel >= 2) {
    await pool.execute(
      `
    INSERT INTO Sensor
    (
      Worker_id,
      Helmet_id,
      Temperature,
      Heart_rate,
      ECG_value,
      Measured_at,
      Status_Level
    )
    VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `,
      [
        workerId,
        helmetId,
        temperature,
        heartRate,
        ecgValue,
        aiResult.riskLevel
      ]
    );

    logger.warn("[Sensor] 위험 데이터 저장 완료.");
  }

  // 위험 상태가 이전 상태와 달라졌을 때만 Alert 생성
  if (aiResult.riskLevel >= 2) {
    await pool.execute(
      `
      INSERT INTO Alert
      (
        Worker_id,
        Helmet_id,
        Status,
        Message
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Status = VALUES(Status),
        Message = VALUES(Message)
      `,
      [
        workerId,
        helmetId,
        aiResult.riskLevel,
        aiResult.message
      ]
    );

    logger.warn("[Alert] Alert 생성 or 업데이트 완료", {
      riskLevel: aiResult.riskLevel,
      riskStatus: aiResult.riskStatus,
      previousStatus,
    });
  } else {
    await pool.execute(
      `
    DELETE FROM Alert
    WHERE Worker_id = ? AND Helmet_id = ?
    `,
      [workerId, helmetId]
    );

    logger.info("[Alert] 정상 상태로 복귀하여 Alert 삭제");
  }

  logger.info("[Sensor API] 센서 데이터 저장 처리 완료");

  res.json({
    success: true,
    message: "센서 데이터 추가 성공",
    data: {
      workerId,
      helmetId,
      heartRate,
      temperature,
      ecgValue,
      avgHeartRate,
      avgTemperature,
    },
    ai: aiResult
  });
});

// 최신 센서 데이터 조회 API
export const getLatestSensorData = asyncHandler(async (req, res) => {
  const { workerId, helmetId } = req.params;

  if (!workerId || isNaN(workerId) || !helmetId || isNaN(helmetId)) {
    logger.warn("[Validation Error] 유효하지 않은 작업자 ID 또는 헬멧 ID", {
      workerId,
      helmetId,
    });

    const error = new Error("유효하지 않은 작업자 ID 또는 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(`
      SELECT *
      FROM current_sensor_status
      WHERE worker_id = ? AND helmet_id = ?
      ORDER BY updated_at DESC
    `, [workerId, helmetId]);

  logger.info("[DB] 최신 센서 데이터 조회 완료", {
    count: rows.length,
  });

  res.json({
    success: true,
    data: rows
  });
});

// 특정 작업자의 센서 기록 조회 API
export const getWorkerSensorData = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  if (!workerId || isNaN(workerId)) {
    logger.warn("[Validation Error] 유효하지 않은 작업자 ID", {
      workerId,
    });

    const error = new Error("유효하지 않은 작업자 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      SELECT
        ID AS sensorId,
        Temperature,
        Heart_rate,
        ECG_value,
        Measured_at
      FROM Sensor
      WHERE Worker_id = ?
      ORDER BY Measured_at DESC
      LIMIT 100
    `;

  const [rows] = await pool.execute(sql, [workerId]);

  logger.info("[DB] 작업자 센서 기록 조회 완료", {
    workerId,
    count: rows.length,
  });

  res.json({
    success: true,
    data: rows
  });
});
