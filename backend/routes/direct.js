const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dataDir = "./Data"; // Directory where JSON files are stored

// Function to read data from all JSON files
const readFromJsonFiles = () => {
  try {
    let combinedData = { data: [] };

    // Read all files in the data directory
    const files = fs.readdirSync(dataDir);

    // Filter and read only JSON files
    files.forEach((file) => {
      if (file.startsWith("data_") && file.endsWith(".json")) {
        const filePath = path.join(dataDir, file);
        try {
          const fileContent = fs.readFileSync(filePath, "utf8");
          const jsonData = JSON.parse(fileContent);
          combinedData.data.push(...jsonData.data); // Combine data from all files
        } catch (err) {
          console.error(`Error reading or parsing file ${file}:`, err);
        }
      }
    });

    return combinedData;
  } catch (err) {
    console.error("Error reading from JSON files:", err);
    return { data: [] };
  }
};

// Paginate results
const paginateResults = (results, page, limit) => {
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const totalRecords = results.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedResults = results.slice(startIndex, startIndex + pageSize);

  return {
    results: paginatedResults,
    pagination: {
      currentPage,
      totalPages,
      totalRecords,
      pageSize,
    },
  };
};

router.get("/direct", (req, res) => {
  const {
    npi,
    firstName,
    lastName,
    address,
    city,
    state,
    mailingCity,
    mailingState,
    licenseNo,
    specialty,
    country,
    page = 1,
    limit = 10,
  } = req.query;

  const hasAtLeastOneField = [
    npi,
    firstName,
    lastName,
    address,
    city,
    state,
    mailingCity,
    mailingState,
    licenseNo,
    specialty,
    country,
  ].some((field) => field && field.trim() !== "");

  if (!hasAtLeastOneField) {
    return res.status(400).json({
      error: "Please provide at least one search field.",
    });
  }

  try {
    const inMemoryIndex = readFromJsonFiles();
    const results = inMemoryIndex.data.filter((item) => {
      if (!item || typeof item !== "object") return false;

      const matchesNPI = npi
          ? item.NPI && item.NPI.toString() === npi.toString()
          : true;
      const matchesFirstName = firstName
          ? item.HCP_first_name &&
          item.HCP_first_name.toLowerCase() === firstName.toLowerCase()
          : true;
      const matchesLastName = lastName
          ? item.HCP_last_name &&
          item.HCP_last_name.toLowerCase() === lastName.toLowerCase()
          : true;
      const matchesAddress = address
          ? item.practice_address &&
          item.practice_address.toLowerCase() === address.toLowerCase()
          : true;
      const matchesState = state
          ? item.practice_st &&
          item.practice_st.toLowerCase() === state.toLowerCase()
          : true;
      const matchesCity = city
          ? item.practice_city &&
          item.practice_city.toLowerCase() === city.toLowerCase()
          : true;
      const matchesMailingCity = mailingCity
          ? item.mailing_city &&
          item.mailing_city.toLowerCase() === mailingCity.toLowerCase()
          : true;
      const matchesMailingState = mailingState
          ? item.mailing_st &&
          item.mailing_st.toLowerCase() === mailingState.toLowerCase()
          : true;
      const matchesLicenseNo = licenseNo
          ? item.License_Number &&
          item.License_Number.toLowerCase() === licenseNo.toLowerCase()
          : true;
      const matchesSpecialty = specialty
          ? (
              (item.Specialty_1 && item.Specialty_1.toLowerCase() === specialty.toLowerCase()) ||
              (item.Specialty_2 && item.Specialty_2.toLowerCase() === specialty.toLowerCase()) ||
              (item.Specialty_3 && item.Specialty_3.toLowerCase() === specialty.toLowerCase())
          )
          : true;
      const matchesCountry = country
          ? item.Country && item.Country.toLowerCase() === country.toLowerCase()
          : true;

      return (
          matchesNPI &&
          matchesFirstName &&
          matchesLastName &&
          matchesAddress &&
          matchesState &&
          matchesCity &&
          matchesMailingCity &&
          matchesMailingState &&
          matchesLicenseNo &&
          matchesSpecialty &&
          matchesCountry
      );
    });

    const paginatedResults = paginateResults(results, page, limit);

    res.json({
      results: paginatedResults.results,
      pagination: paginatedResults.pagination,
    });
  } catch (error) {
    console.error("Error processing search request:", error);
    res.status(500).json({ error: "An error occurred while processing the search request." });
  }
});

router.get("/direct/view/:npi", (req, res) => {
  const { npi } = req.params;
  try {
    const inMemoryIndex = readFromJsonFiles();
    const record = inMemoryIndex.data.find(
        (item) => item.NPI && item.NPI.toString() === npi
    );
    if (!record) {
      return res.status(404).json({ error: "Record not found." });
    }
    res.json({ record });
  } catch (error) {
    console.error("Error fetching record details:", error);
    res.status(500).json({ error: "An error occurred while fetching the record." });
  }
});

module.exports = router;