const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { fetchAndIndexData, jobStatus } = require("./jobs/fetchAndIndex");
const allDataRoutes = require("./routes/alldata");
const smartRoutes = require("./routes/smart");
const directRoutes = require("./routes/direct");
const multipleRoutes = require("./routes/multiple");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/job/start", async (req, res) => {
  if (jobStatus.running) {
    console.log("Manual job start request rejected: Job is already running.");
    return res.status(400).json({ error: "Job is already running." });
  }

  try {
    console.log("Manual job started...");
    await fetchAndIndexData(100, 120000); 
    console.log("Manual job completed successfully.");
    res.status(200).json({ message: "Job completed successfully.", status: jobStatus });
  } catch (err) {
    console.error("Job failed:", err);
    res.status(500).json({ error: "Failed to run the job.", details: err.message });
  }
});

app.use("/data", allDataRoutes);
app.use("/search/smart", smartRoutes);
app.use("/search", directRoutes);  
app.use("/search", multipleRoutes);

app.get("/", (req, res) => {
  res.status(200).send(`
    <h1>Welcome to the API</h1>
    <p>Available Endpoints:</p>
    <ul>
        <li><b>Manual Job Trigger:</b> <code>GET /job/start</code></li>
        <li><b>View In-Memory Data:</b> <code>GET /data/all-data</code></li>
    </ul>
  `);
});
cron.schedule("*/2 * * * *", async () => {
  if (jobStatus.running) {
    console.log("Scheduled job skipped: Job is already running.");
    return; // Prevent overlapping jobs
  }

  console.log("Scheduled job started...");
  try {
    await fetchAndIndexData(10000,  1000000);
    console.log("Scheduled job completed successfully.");
  } catch (err) {
    console.error("Error during scheduled job execution:", err);
  }
});

(async () => {
  try {
    console.log("Server startup: Fetching initial data...");
    await fetchAndIndexData(10000,  1000000);
    console.log("Initial data fetch completed successfully.");
  } catch (err) {
    console.error("Error during initial data fetch:", err);
  }
})();
const PORT = process.env.PORT || 5000;curl
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
