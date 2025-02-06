const fs = require("fs");
const path = require("path");
const connectToDB = require("../config/db");

const dataDir = "./Data";
const indexFilePath = path.join(dataDir, "index.json");
let jobStatus = {
  running: false,
  progress: "Idle",
};

const ensureDataDirExists = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const initializeIndexFile = () => {
  if (!fs.existsSync(indexFilePath)) {
    fs.writeFileSync(indexFilePath, JSON.stringify({ files: [] }, null, 2));
  }
};

const validateAndRepairIndexFile = () => {
  try {
    const fileContent = fs.readFileSync(indexFilePath, "utf8");
    JSON.parse(fileContent);
  } catch (err) {
    console.error("Invalid index file detected. Repairing...");
    fs.writeFileSync(indexFilePath, JSON.stringify({ files: [] }, null, 2));
  }
};

const appendToJsonFile = (rows, fileIndex) => {
  const filePath = path.join(dataDir, `data_${fileIndex}.json`);
  try {
    let jsonData = { data: [] };
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      jsonData = JSON.parse(fileContent);
    }

    jsonData.data.push(...rows);
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

    const indexContent = fs.readFileSync(indexFilePath, "utf8");
    const indexData = JSON.parse(indexContent);

    const fileInfo = indexData.files.find((file) => file.index === fileIndex);
    if (fileInfo) {
      fileInfo.endNPI = rows[rows.length - 1].NPI;
    } else {
      indexData.files.push({
        index: fileIndex,
        startNPI: rows[0].NPI,
        endNPI: rows[rows.length - 1].NPI,
      });
    }

    fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2));
    console.log(`Appended data to JSON file ${filePath} successfully.`);
  } catch (err) {
    console.error("Error appending to JSON file:", err);
  }
};

const fetchAndIndexData = async (batchSize = 10000, maxDuration = 600000) => {
  ensureDataDirExists();
  initializeIndexFile();
  validateAndRepairIndexFile();

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
    let fileIndex = 0;

    while (Date.now() - startTime < maxDuration) {
      const query = `
        SELECT TOP (${batchSize}) NPI, HCP_first_name, HCP_last_name, Provider_Credential_Text, "Provider_Name_Prefix_Text", practice_address, practice_city, practice_st, practice_postal_code, mailing_address, mailing_city, mailing_st, mailing_postal_code, Taxonomy_Code, License_Number, Provider_License_State, Specialty_1, Specialty_2, Specialty_3, Country
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

      const indexContent = fs.readFileSync(indexFilePath, "utf8");
      const indexData = JSON.parse(indexContent);
      if (indexData.files.length > 0) {
        const lastFile = indexData.files[indexData.files.length - 1];
        if (lastFile.endNPI < rows[0].NPI) {
          fileIndex = indexData.files.length;
        }
      }

      appendToJsonFile(rows, fileIndex);
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
    const indexContent = fs.readFileSync(indexFilePath, "utf8");
    const indexData = JSON.parse(indexContent);

    if (indexData.files.length > 0) {
      const lastFile = indexData.files[indexData.files.length - 1];
      return lastFile.endNPI;
    }
    return 0;
  } catch (err) {
    console.error("Error reading last fetched NPI:", err);
    return 0;
  }
};

const searchData = (npi) => {
  try {
    const indexContent = fs.readFileSync(indexFilePath, "utf8");
    const indexData = JSON.parse(indexContent);

    for (const fileInfo of indexData.files) {
      if (npi >= fileInfo.startNPI && npi <= fileInfo.endNPI) {
        const filePath = path.join(dataDir, `data_${fileInfo.index}.json`);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(fileContent);

        const result = jsonData.data.find((record) => record.NPI === npi);
        if (result) {
          return result;
        }
      }
    }
    return null;
  } catch (err) {
    console.error("Error searching data:", err);
    return null;
  }
};

module.exports = { fetchAndIndexData, jobStatus, searchData };