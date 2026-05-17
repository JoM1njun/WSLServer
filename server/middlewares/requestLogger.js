// Server Logging Middleware (Request & Response)
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    console.log("\n==============================");
    console.log(`📥 [REQUEST] ${req.method} ${req.originalUrl}`);
    console.log("==============================");

    console.log("[Params]", req.params);
    console.log("[Query]", req.query);
    console.log("[Body]", req.body);

    // 응답 완료 시 실행
    res.on("finish", () => {
        const duration = Date.now() - start;

        console.log(`📤 [RESPONSE] ${req.method} ${req.originalUrl}`);

        console.log("[Status]", res.statusCode);

        console.log(`[Duration] ${duration}ms`);

        console.log("==============================\n");
    });

    next();
};