const fs = require("fs");
const connectToDB = require("../config/db");

// File path for storing the fetched data
const dataFilePath = "D:/web/smart/Jobs/backend/jobs/data2.json";

let jobStatus = {
  running: false,
  progress: "Idle",
};

// Helper function to initialize the JSON file if it doesn't exist
const initializeJsonFile = () => {
  try {
    if (!fs.existsSync(dataFilePath)) {
      console.log("File doesn't exist. Initializing new JSON file.");
      fs.writeFileSync(dataFilePath, JSON.stringify({ data: [] }, null, 2)); // Initialize with {"data":[]}
    } else {
      // Validate the existing file
      validateAndRepairJsonFile();
    }
  } catch (err) {
    console.error("Error initializing JSON file:", err);
  }
};

// Helper function to validate and repair the JSON file
const validateAndRepairJsonFile = () => {
  try {
    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    JSON.parse(fileContent); // Try parsing to ensure it's valid
  } catch (err) {
    console.error("Invalid JSON file detected. Repairing...");
    fs.writeFileSync(dataFilePath, JSON.stringify({ data: [] }, null, 2)); // Reset to valid structure
  }
};

// Helper function to append new rows to the "data" array in the JSON file
const appendToJsonFile = (rows) => {
  try {
    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    const jsonData = JSON.parse(fileContent); // Parse the existing JSON content

    jsonData.data.push(...rows);

    // Write the updated content back to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2));
    console.log("Appended data to JSON file successfully.");
  } catch (err) {
    console.error("Error appending to JSON file:", err);
  }
};

// Main function to fetch and index data
const fetchAndIndexData = async (batchSize = 10000, maxDuration = 600000) => {
  initializeJsonFile(); 

  const lastFetchedId = getLastFetchedNPI(); 

  if (jobStatus.running) {
    console.warn("Job is already running. Skipping execution.");
    return;
  }

  jobStatus.running = true;
  const startTime = Date.now(); 
  jobStatus.progress = "Starting data fetch...";
  console.log(jobStatus.progress);

  try {
    const pool = await connectToDB();
    console.log("Connected to the database.");

    let currentLastFetchedId = lastFetchedId;

    // Fetch data from DB in chunks and append to file
    while (Date.now() - startTime < maxDuration) {
      const query = `
        SELECT TOP (${batchSize}) *
        FROM hcp_search_20250106
        WHERE NPI > ${currentLastFetchedId}
        ORDER BY NPI ASC
      `;
      const result = await pool.request().query(query);

      const rows = result.recordset;

      if (rows.length === 0) {
        console.log("No more data to fetch.");
        break; // Exit loop when no more rows are returned
      }

      appendToJsonFile(rows);
      console.log("Fetched rows:", rows.length);

      currentLastFetchedId = rows[rows.length - 1].NPI;
    }

    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    console.log(`Job stopped after ${duration} seconds.`);
    jobStatus.progress = `Data fetch completed in ${duration} seconds.`;
  } catch (err) {
    jobStatus.progress = "Error occurred during data fetch.";
    console.error(jobStatus.progress, err);
  } finally {
    jobStatus.running = false;
  }
};

const getLastFetchedNPI = () => {
  try {
    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    const jsonData = JSON.parse(fileContent);

    const lastRecord = jsonData.data[jsonData.data.length - 1];
    return lastRecord ? lastRecord.NPI : 0;
  } catch (err) {
    console.error("Error reading last fetched NPI:", err);
    return 0; // Default fallback
  }
};

module.exports = { fetchAndIndexData, jobStatus };
