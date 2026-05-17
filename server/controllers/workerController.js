import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// =======================
// Worker INSERT / UPDATE / DELETE
// =======================

// 작업자 추가 INSERT
export const insertWorker = asyncHandler(async (req, res) => {
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

  if (!name || !birthDate || !gender) {
    logger.warn("[Validation Error] 필수값 누락", {
      name,
      birthDate,
      gender
    });

    const error = new Error("이름, 생년월일, 성별은 필수입니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      INSERT INTO Worker
      (Name, Birth_date, Gender, Position, Blood_type, Emergency_contact, Disease, Department_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  await pool.execute(sql, [
    name,
    birthDate,
    gender,
    position,
    bloodType,
    emergencyContact,
    disease,
    departmentId
  ]);

  logger.info("[DB] 작업자 데이터 INSERT 완료", {
    name, departmentId
  });

  res.json({
    success: true,
    message: "작업자 추가 성공"
  });
});

// 작업자 수정 UPDATE
export const updateWorker = asyncHandler(async (req, res) => {
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

  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push("Name = ?");
    values.push(name);
  }

  if (birthDate !== undefined) {
    fields.push("Birth_date = ?");
    values.push(birthDate);
  }

  if (gender !== undefined) {
    fields.push("Gender = ?");
    values.push(gender);
  }

  if (position !== undefined) {
    fields.push("Position = ?");
    values.push(position);
  }

  if (bloodType !== undefined) {
    fields.push("Blood_type = ?");
    values.push(bloodType);
  }

  if (emergencyContact !== undefined) {
    fields.push("Emergency_contact = ?");
    values.push(emergencyContact);
  }

  if (disease !== undefined) {
    fields.push("Disease = ?");
    values.push(disease);
  }

  if (departmentId !== undefined) {
    fields.push("Department_id = ?");
    values.push(departmentId);
  }

  if (fields.length === 0) {
    logger.warn("[Validation Error] 수정할 데이터 없음", {
      workerId
    });

    const error = new Error("수정할 데이터가 없습니다.");
    error.statusCode = 400;
    throw error;
  }

  logger.info("[UPDATE Fields]", {
    workerId,
    fields
  });

  values.push(workerId);

  const sql = `
    UPDATE Worker
    SET ${fields.join(", ")}
    WHERE ID = ?
  `;

  await pool.execute(sql, values);

  logger.info("[DB] 작업자 데이터 UPDATE 완료", {
    workerId
  });

  res.json({
    success: true,
    message: "작업자 수정 성공"
  });
});

// 작업자 삭제 DELETE
export const deleteWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  if (!workerId || isNaN(workerId)) {
    logger.warn("[Validation Error] 유효하지 않은 작업자 ID", {
      workerId
    });

    const error = new Error("유효하지 않은 작업자 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

  const sql = `
      DELETE FROM Worker
      WHERE ID = ?
    `;

  await pool.execute(sql, [workerId]);

  logger.warn("[DB] 작업자 데이터 DELETE 완료", {
    workerId
  });

  res.json({
    success: true,
    message: "작업자 삭제 성공"
  });
});

// 전체 작업자 조회 API
export const getWorkers = asyncHandler(async (req, res) => {
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

  logger.info("[DB] 전체 작업자 조회 완료", {
    count: rows.length
  });


  res.json({
    success: true,
    data: rows
  });
});

// 특정 작업자 조회 API
export const getWorkerById = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  if (!workerId || isNaN(workerId)) {
    logger.warn("[Validation Error] 유효하지 않은 작업자 ID", {
      workerId
    });

    const error = new Error("유효하지 않은 작업자 ID입니다.");
    error.statusCode = 400;
    throw error;
  }

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
    WHERE w.ID = ?
  `;

  const [rows] = await pool.execute(sql, [workerId]);

  if (rows.length === 0) {
    logger.warn("[Not Found] 해당 작업자 없음", {
      workerId
    });

    const error = new Error("해당 작업자가 존재하지 않습니다.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("[DB] 특정 작업자 조회 완료", {
    resultCount: rows.length
  });

  res.json({
    success: true,
    data: rows[0]
  });
});