const fs = require("fs");
const connectToDB = require("../config/db");

const dataFilePath = "/Users/test/Sites/hcp-search/backend/jobs/data2.json";
let jobStatus = {
  running: false,
  progress: "Idle",
};

const initializeJsonFile = () => {
  try {
    if (!fs.existsSync(dataFilePath)) {
      console.log("File doesn't exist. Initializing new JSON file.");
      fs.writeFileSync(dataFilePath, JSON.stringify({ data: [] }, null, 2)); // Initialize with {"data":[]}
    } else {
      validateAndRepairJsonFile();
    }
  } catch (err) {
    console.error("Error initializing JSON file:", err);
  }
};

const validateAndRepairJsonFile = () => {
  try {
    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    JSON.parse(fileContent);
  } catch (err) {
    console.error("Invalid JSON file detected. Repairing...");
    fs.writeFileSync(dataFilePath, JSON.stringify({ data: [] }, null, 2));
  }
};

const appendToJsonFile = (rows) => {
  try {
    const fileContent = fs.readFileSync(dataFilePath, "utf8");
    const jsonData = JSON.parse(fileContent); // Parse the existing JSON content

    jsonData.data.push(...rows);

    fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2));
    console.log("Appended data to JSON file successfully.");
  } catch (err) {
    console.error("Error appending to JSON file:", err);
  }
};

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
        break;
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
    return 0;
  }
};

module.exports = { fetchAndIndexData, jobStatus };
