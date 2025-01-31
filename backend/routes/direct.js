const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dataFilePath = "D:/web/smart/Jobs/backend/jobs/data2.json"; // Update this path as per your setup
const readFromJsonFile = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(data);
    }
    return { data: [] };
  } catch (err) {
    console.error("Error reading from JSON file:", err);
    return { data: [] };
  }
};

router.get("/direct", (req, res) => {
  const {
    firstName,
    lastName,
    npi,
    specialty,
    state,
    city,
    page = 1,
    limit = 10,
  } = req.query;

  const hasAtLeastOneField = [
    firstName,
    lastName,
    npi,
    specialty,
    state,
    city,
  ].some((field) => field && field.trim() !== "");

  if (!hasAtLeastOneField) {
    return res.status(400).json({
      error: "Please provide at least one search field.",
    });
  }

  try {
    const inMemoryIndex = readFromJsonFile();
    const results = inMemoryIndex.data.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const matchesFirstName = firstName
        ? item.HCP_first_name &&
          item.HCP_first_name.toLowerCase() === firstName.toLowerCase()
        : true;
      const matchesLastName = lastName
        ? item.HCP_last_name &&
          item.HCP_last_name.toLowerCase() === lastName.toLowerCase()
        : true;
      const matchesNPI = npi
        ? item.NPI && item.NPI.toString() === npi.toString()
        : true;
        const matchesSpecialty = specialty
        ? (
            (item.Specialty_1 && item.Specialty_1.toLowerCase() === specialty.toLowerCase()) ||
            (item.Specialty_2 && item.Specialty_2.toLowerCase() === specialty.toLowerCase()) ||
            (item.Specialty_3 && item.Specialty_3.toLowerCase() === specialty.toLowerCase())
          )
        : true;
      const matchesState = state
        ? item.practice_st &&
          item.practice_st.toLowerCase() === state.toLowerCase()
        : true;
      const matchesCity = city
        ? item.practice_city &&
          item.practice_city.toLowerCase() === city.toLowerCase()
        : true;
      return (
        matchesFirstName &&
        matchesLastName &&
        matchesNPI &&
        matchesSpecialty &&
        matchesState &&
        matchesCity
      );
    });
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedResults = results.slice(offset, offset + parseInt(limit, 10));

    res.json({
      results: paginatedResults,
      pagination: {
        totalRecords: results.length,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(results.length / limit),
        pageSize: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error processing search request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the search request." });
  }
});


router.get("/direct/view/:npi", (req, res) => {
  const { npi } = req.params;
  try {
    const inMemoryIndex = readFromJsonFile(); // Read data from the JSON file
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
