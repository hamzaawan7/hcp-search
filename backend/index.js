const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { fetchAndIndexData, jobStatus } = require("./jobs/fetchAndIndex");
const allDataRoutes = require("./routes/alldata"); // Import the all-data route
const smartRoutes = require("./routes/smart"); // Import the smart search routes
const directRoutes = require("./routes/direct"); // Import the direct search routes
const multipleRoutes = require("./routes/multiple"); // Import the multiple search routes

const app = express();
app.use(cors());
app.use(express.json());

// Manual job trigger
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

// Register the route to view all data from the JSON file
app.use("/data", allDataRoutes);
app.use("/search/smart", smartRoutes);
app.use("/search", directRoutes);  
app.use("/search", multipleRoutes);

// Default route
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

// Schedule the job to run every 2 minutes
cron.schedule("*/2 * * * *", async () => {
  if (jobStatus.running) {
    console.log("Scheduled job skipped: Job is already running.");
    return; // Prevent overlapping jobs
  }

  console.log("Scheduled job started...");
  try {
    await fetchAndIndexData(500,  600000); 
    console.log("Scheduled job completed successfully.");
  } catch (err) {
    console.error("Error during scheduled job execution:", err);
  }
});

// Automatically start the job when the server starts
(async () => {
  try {
    console.log("Server startup: Fetching initial data...");
    await fetchAndIndexData(500,  600000); 
    console.log("Initial data fetch completed successfully.");
  } catch (err) {
    console.error("Error during initial data fetch:", err);
  }
})();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
