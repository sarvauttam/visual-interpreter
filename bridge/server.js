const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Paths
const ROOT = path.join(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build", "Debug");
const EXECUTABLE = path.join(BUILD_DIR, "vi.exe");

const TEMP_SOURCE = path.join(__dirname, "temp_source.vi");
const TEMP_TRACE = path.join(__dirname, "temp_trace.jsonl");

// Run interpreter
app.post("/run", async (req, res) => {
  try {
    const { source } = req.body;

    if (!source || !source.trim()) {
      return res.status(400).json({ error: "No source provided" });
    }

    // Write source file
    fs.writeFileSync(TEMP_SOURCE, source);

    // Remove old trace if exists
    if (fs.existsSync(TEMP_TRACE)) {
      fs.unlinkSync(TEMP_TRACE);
    }

    // Run interpreter
    const proc = spawn(EXECUTABLE, [TEMP_SOURCE, "--trace", TEMP_TRACE]);

    let stderr = "";

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({
          error: "Interpreter failed",
          detail: stderr
        });
      }

      if (!fs.existsSync(TEMP_TRACE)) {
        return res.status(500).json({
          error: "Trace file not produced"
        });
      }

      const traceText = fs.readFileSync(TEMP_TRACE, "utf8");

      const events = traceText
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l));

      res.json({ events });
    });

  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`VI Bridge running on http://localhost:${PORT}`);
});