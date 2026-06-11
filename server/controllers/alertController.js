import { pool } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// 전체 Alert 조회 API
export const getAlerts = asyncHandler(async (req, res) => {
    const sql = `
    SELECT
      a.ID AS alertId,
      a.Worker_id AS workerId,
      w.Name AS workerName,
      a.Helmet_id AS helmetId,
      a.Status AS status,
      a.Message AS message,
      a.Created_at AS createdAt,
      a.Updated_at AS updatedAt
    FROM Alert a
    LEFT JOIN Worker w ON a.Worker_id = w.ID
    ORDER BY a.Updated_at DESC
  `;

    const [rows] = await pool.execute(sql);

    logger.info("[DB] Alert 전체 조회 완료", {
        count: rows.length,
    });

    res.json({
        success: true,
        data: rows,
    });
});

export const getWorkerAlerts = asyncHandler(async (req, res) => {
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
      a.ID AS alertId,
      a.Worker_id AS workerId,
      w.Name AS workerName,
      a.Helmet_id AS helmetId,
      a.Status AS status,
      a.Message AS message,
      a.Created_at AS createdAt,
      a.Updated_at AS updatedAt
    FROM Alert a
    LEFT JOIN Worker w ON a.Worker_id = w.ID
    WHERE a.Worker_id = ?
    ORDER BY a.Updated_at DESC
  `;

    const [rows] = await pool.execute(sql, [workerId]);

    logger.info("[DB] 특정 작업자 Alert 조회 완료", {
        workerId,
        count: rows.length,
    });

    res.json({
        success: true,
        data: rows,
    });
});