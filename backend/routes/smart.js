const express = require("express");
const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// File path for storing the fetched data
const dataFilePath = "D:/web/smart/Jobs/backend/jobs/data2.json"; // Update this path as per your setup

// Helper function to read data from the JSON file
const readFromJsonFile = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(data);
    }
    return { data: [] }; // Return empty data structure if file doesn't exist
  } catch (err) {
    console.error("Error reading from JSON file:", err);
    return { data: [] }; // Fallback if an error occurs
  }
};

// Helper function for pagination
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

// Smart search: Exact match with pagination (case-insensitive)
router.get("/exact", (req, res) => {
  const { term, country, page = 1, limit = 10 } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Search term is required." });
  }

  const inMemoryIndex = readFromJsonFile();
  const lowerCaseTerm = term.toLowerCase();

  let results = inMemoryIndex.data.filter(
    (item) =>
      (item.HCP_first_name && item.HCP_first_name.toLowerCase() === lowerCaseTerm) ||
      (item.HCP_last_name && item.HCP_last_name.toLowerCase() === lowerCaseTerm) ||
      (item.practice_city && item.practice_city.toLowerCase() === lowerCaseTerm)
  );

  // Apply country filter if provided
  if (country) {
    const lowerCaseCountry = country.toLowerCase();
    results = results.filter(
      (item) => item.Country && item.Country.toLowerCase() === lowerCaseCountry
    );
  }

  const paginated = paginateResults(results, page, limit);
  res.json(paginated);
});

// Smart search: Suggested match with fuzzy results included (case-insensitive)
router.get("/suggested", (req, res) => {
  let { page = 1, limit = 10, country, ...filters } = req.query;

  // Mapping frontend search fields to actual JSON database keys
  const fieldMapping = {
    firstName: "HCP_first_name",
    lastName: "HCP_last_name",
    city: "practice_city",
    country: "Country",
    address: "practice_address",
    specialty: "Specialty_1",
    npi: "NPI",
    state: "practice_st",
  };

  const filledFields = Object.entries(filters)
    .filter(([_, value]) => value.trim() !== "")
    .map(([key, value]) => ({
      key: fieldMapping[key] || key,
      value: value.toLowerCase(),
    }));

  if (filledFields.length === 0) {
    return res.status(400).json({ error: "At least one search field must be filled." });
  }

  const inMemoryIndex = readFromJsonFile();

  console.log(`🔍 Searching for:`, filledFields);

  let exactMatches = inMemoryIndex.data.filter((item) =>
    filledFields.every(({ key, value }) =>
      item[key] && item[key].toString().toLowerCase() === value
    )
  );

  // Apply country filter if provided
  if (country) {
    const lowerCaseCountry = country.toLowerCase();
    exactMatches = exactMatches.filter(
      (item) => item.Country && item.Country.toLowerCase() === lowerCaseCountry
    );
  }

  // Remove exact matches from fuzzy search candidates
  let fuzzySearchData = inMemoryIndex.data.filter((item) => !exactMatches.includes(item));

  // Apply country filter for fuzzy search as well
  if (country) {
    const lowerCaseCountry = country.toLowerCase();
    fuzzySearchData = fuzzySearchData.filter(
      (item) => item.Country && item.Country.toLowerCase() === lowerCaseCountry
    );
  }

  const options = {
    keys: filledFields.map(({ key }) => key), // Use only searched keys
    threshold: 0.5, // Control fuzzy matching sensitivity
    distance: 100, // Consider matches within a reasonable edit distance
    includeScore: true,
  };

  const fuse = new Fuse(fuzzySearchData, options);
  const fuzzyResults = fuse
    .search(filledFields.map((f) => f.value).join(" "))
    .map((result) => ({
      ...result.item,
      similarity: ((1 - result.score) * 100).toFixed(2) + "%", // Convert score to percentage
    }));

  console.log("✅ Exact Matches:", exactMatches);
  console.log("🔍 Fuzzy Search Results:", fuzzyResults);

  const paginatedFuzzyResults = paginateResults(fuzzyResults, page, limit);

  res.status(200).json({
    exactMatches,
    suggestedMatches: paginatedFuzzyResults.results,
    pagination: paginatedFuzzyResults.pagination,
  });
});

module.exports = router;
