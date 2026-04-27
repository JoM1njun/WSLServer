const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🔥 Node 서버 연결 성공!");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
