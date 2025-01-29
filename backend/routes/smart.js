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

  let exactMatches = [];
  let fuzzySearchData = [];

  let filteredData = country
    ? inMemoryIndex.data.filter(
        (item) => item.Country && item.Country.toLowerCase() === country.toLowerCase()
      )
    : inMemoryIndex.data;

  // Finding exact matches based on strict criteria
  exactMatches = filteredData.filter((item) => {
    let totalFields = filledFields.length;
    let matchedFields = filledFields.filter(({ key, value }) =>
      item[key] && item[key].toString().toLowerCase() === value
    ).length;

    // If all fields match, assign 100% similarity
    return matchedFields === totalFields;
  }).map((item) => ({
    ...item,
    similarity: "100.00%",
  }));

  // Removing exact matches from fuzzy search data
  fuzzySearchData = filteredData.filter((item) => !exactMatches.includes(item));

  // Fuzzy search configuration
  const options = {
    keys: filledFields.map(({ key }) => key),
    threshold: 0.4, // Adjust fuzziness threshold
    distance: 100,
    includeScore: true,
  };

  const fuse = new Fuse(fuzzySearchData, options);
  let fuzzyResults = [];

  // Iterate over all data and compute similarity based on matched fields
  fuzzySearchData.forEach((item) => {
    let totalFields = filledFields.length;
    let matchedFields = filledFields.filter(({ key, value }) =>
      item[key] && item[key].toString().toLowerCase() === value
    ).length;

    if (matchedFields > 0) {
      let similarityScore = ((matchedFields / totalFields) * 100).toFixed(2) + "%";
      fuzzyResults.push({
        ...item,
        similarity: similarityScore, // Assign similarity dynamically
      });
    }
  });

  // Removing duplicate fuzzy results using NPI as a unique identifier
  const uniqueResults = Array.from(new Map(fuzzyResults.map((item) => [item.NPI, item])).values());

  const suggestedMatches = uniqueResults.filter((item) => parseFloat(item.similarity) < 100.0 && parseFloat(item.similarity) >= 50.0);


  console.log("✅ Exact Matches:", exactMatches.length);
  console.log("🔍 Fuzzy Search Results:", suggestedMatches.length);

  // Paginate fuzzy search results
  const paginatedFuzzyResults = paginateResults(suggestedMatches, page, limit);

  res.status(200).json({
    exactMatches,
    suggestedMatches: paginatedFuzzyResults.results,
    pagination: paginatedFuzzyResults.pagination,
  });
});





module.exports = router;
