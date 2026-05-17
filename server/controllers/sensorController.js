import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Sensor Data Insert API (Post)
// AI 서버와 연동하여 센서 데이터 저장 및 위험 상태 알림 생성
export const insertSensorData = asyncHandler(async (req, res) => {
  console.log("\n==============================");
  console.log("[Sensor API] 센서 데이터 저장 요청 시작");
  console.log("==============================");

  const {
    workerId,
    helmetId,
    temperature,
    heartRate,
    ecgValue,
  } = req.body;

  console.log("[Request Body]", {
    workerId,
    helmetId,
    temperature,
    heartRate,
    ecgValue,
  });

  if (!workerId || isNaN(workerId) || !helmetId || isNaN(helmetId)) {
    console.warn("[Validation Error] 유효하지 않은 작업자 ID 또는 헬멧 ID", {
      workerId,
      helmetId,
    });

    const error = new Error("유효하지 않은 작업자 ID 또는 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  console.log("[Validation] 작업자 ID 및 헬멧 ID 검증 완료");

  const [currentRows] = await pool.execute(
    `
  SELECT status
  FROM current_sensor_status
  WHERE worker_id = ? AND helmet_id = ?
  `,
    [workerId, helmetId]
  );

  const previousStatus = currentRows[0]?.status;

  console.log("[DB] 이전 센서 상태 조회 완료", {
    previousStatus: previousStatus ?? "기존 상태 없음",
  });

  // AI 서버 요청 + timeout
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);

  // AI 서버 연결
  // 추후 AI 모델 서버 URL로 변경 필요
  console.log("[AI] AI 서버 예측 요청 시작");

  const aiResponse = await fetch("http://localhost:8000/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    signal: controller.signal,
    body: JSON.stringify({
      workerId,
      helmetId,
      temperature,
      heartRate,
      ecgAbnormal: Boolean(ecgValue)
    })
  });

  clearTimeout(timeout);

  console.log("[AI] AI 서버 응답 수신", {
    statusCode: aiResponse.status,
    ok: aiResponse.ok,
  });

  if (!aiResponse.ok) {
    console.error("[AI Error] AI 서버 예측 요청 실패", {
      statusCode: aiResponse.status,
    });

    const error = new Error("AI 서버 예측 요청 실패");
    error.statusCode = 502;
    throw error;
  }

  const aiResult = await aiResponse.json();

  console.log("[AI Result]", aiResult);

  // Sensor Log 저장
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
      Status
    )
    VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `,
    [
      workerId,
      helmetId,
      temperature,
      heartRate,
      ecgValue,
      aiResult.status
    ]
  );

  console.log("[DB] Sensor 로그 저장 완료");

  // 센서 데이터 업데이트 (최신화)
  await pool.execute(
    `
  INSERT INTO Current_Sensor_Data
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
      ecgValue,
      aiResult.status,
      aiResult.confidence
    ]
  );

  console.log("[DB] Current_Sensor_Data 최신 상태 업데이트 완료");

  // 4. 위험 상태면 Alert 생성
  if (aiResult.status >= 3 && previousStatus !== aiResult.status) {
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
      `,
      [
        workerId,
        helmetId,
        aiResult.status,
        aiResult.message
      ]
    );
    console.warn("[Alert] Alert 생성 완료");
  } else {
    console.log("[Alert] Alert 생성 조건 아님", {
      status: aiResult.status,
      previousStatus,
    });
  }

  console.log("[Sensor API] 센서 데이터 저장 처리 완료");

  res.json({
    success: true,
    message: "센서 데이터 추가 성공",
    ai: aiResult
  });
});

// 최신 센서 데이터 조회 API
export const getLatestSensorData = asyncHandler(async (req, res) => {
  console.log("\n==============================");
  console.log("[Latest Sensor API] 최신 센서 데이터 조회 요청");
  console.log("==============================");

  const { workerId, helmetId } = req.params;

  console.log("[Request Params]", {
    workerId,
    helmetId,
  });

  if (!workerId || isNaN(workerId) || !helmetId || isNaN(helmetId)) {
    console.warn("[Validation Error] 유효하지 않은 작업자 ID 또는 헬멧 ID", {
      workerId,
      helmetId,
    });

    const error = new Error("유효하지 않은 작업자 ID 또는 헬멧 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(`
      SELECT *
      FROM Current_Sensor_Data
      WHERE worker_id = ? AND helmet_id = ?
      ORDER BY updated_at DESC
    `, [workerId, helmetId]);

  console.log("[DB] 최신 센서 데이터 조회 완료", {
    count: rows.length,
  });

  console.log("[Latest Sensor API] 응답 완료");

  res.json({
    success: true,
    data: rows
  });
});

// 특정 작업자의 센서 기록 조회 API
export const getWorkerSensorData = asyncHandler(async (req, res) => {
  console.log("\n==============================");
  console.log("[Worker Sensor API] 작업자 센서 기록 조회 요청");
  console.log("==============================");

  const { workerId } = req.params;

  console.log("[Request Params]", {
    workerId,
  });

  if (!workerId || isNaN(workerId)) {
    console.warn("[Validation Error] 유효하지 않은 작업자 ID", {
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
        Status,
        Measured_at
      FROM Sensor
      WHERE Worker_id = ?
      ORDER BY Measured_at DESC
      LIMIT 100
    `;

  const [rows] = await pool.execute(sql, [workerId]);

  console.log("[DB] 작업자 센서 기록 조회 완료", {
    workerId,
    count: rows.length,
  });

  console.log("[Worker Sensor API] 응답 완료");

  res.json({
    success: true,
    data: rows
  });
});
