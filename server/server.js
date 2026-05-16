import express from "express";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import helmetRoutes from "./routes/helmetRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/company", companyRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/helmets", helmetRoutes);
app.use("/api/sensors", sensorRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("🔥 Node 서버 연결 성공!");
});

app.listen(PORT, "0.0.0.0", () => {
  const now = new Date();

  console.log(`Server running on port ${PORT}`);
  console.log(`Deploy started at KST: ${now.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul"
  })}`);
  console.log(`Deploy started at UTC: ${now.toISOString()}`);
});