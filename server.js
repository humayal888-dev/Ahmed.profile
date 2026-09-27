require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const chatHandler = require("./api/chat");

const PORT = 3000;
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript"
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };
      await chatHandler(req, res);
    });
    return;
  }

  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));