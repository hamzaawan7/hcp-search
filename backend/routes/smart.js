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
  const { term, page = 1, limit = 10 } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Search term is required." });
  }

  const inMemoryIndex = readFromJsonFile();
  const lowerCaseTerm = term.toLowerCase(); // Convert search term to lowercase for case-insensitive comparison

  const results = inMemoryIndex.data
    .filter(
      (item) =>
        (item.HCP_first_name && item.HCP_first_name.toLowerCase() === lowerCaseTerm) ||
        (item.HCP_last_name && item.HCP_last_name.toLowerCase() === lowerCaseTerm) ||
        (item.practice_city && item.practice_city.toLowerCase() === lowerCaseTerm) 
    )
    .map((result) => ({ ...result, matchType: "exact" })); // Add match type

  const paginated = paginateResults(results, page, limit);

  res.json(paginated);
});

// Smart search: Suggested match with fuzzy results included (case-insensitive)
router.get("/suggested", (req, res) => {
  const { term, page = 1, limit = 10 } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Search term is required." });
  }

  const inMemoryIndex = readFromJsonFile();

  // Perform fuzzy search using Fuse.js
  const options = {
    keys: ["practice_st", "HCP_first_name", "HCP_last_name"], // Fields to search for suggested matches
    threshold: 0.4, // Sensitivity for fuzzy matching
    distance: 100,
    includeScore: true,
  };

  // Normalize data for case-insensitive search
  const normalizedData = inMemoryIndex.data.map((item) => ({
    ...item,
    practice_city: item.practice_city ? item.practice_city.toLowerCase() : "",
    practice_st: item.practice_st ? item.practice_st.toLowerCase() : "",
    HCP_first_name: item.HCP_first_name ? item.HCP_first_name.toLowerCase() : "",
    HCP_last_name: item.HCP_last_name ? item.HCP_last_name.toLowerCase() : "",
  }));

  const fuse = new Fuse(normalizedData, options);
  const fuzzyResults = fuse.search(term.toLowerCase()).map((result) => ({
    ...result.item,
    similarity: ((1 - result.score) * 100).toFixed(2) + "%", // Add similarity score
  }));

  const paginated = paginateResults(fuzzyResults, page, limit);

  res.status(200).json(paginated);
});

module.exports = router;
