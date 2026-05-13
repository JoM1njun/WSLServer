export function errorHandler(err, req, res, next) {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "서버 오류가 발생했습니다."
  });
}