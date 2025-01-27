const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

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

// Multiple search route with pagination
router.get("/multiple", (req, res) => {
  const { term, page = 1, limit = 10 } = req.query;

  // Validate the search term
  if (!term) {
    return res.status(400).json({ error: "Search term is required." });
  }

  try {
    // Split the term into an array of NPI values, trimming whitespace
    const npiList = term.split(",").map((id) => id.trim());

    const inMemoryIndex = readFromJsonFile(); // Read data from the JSON file

    // Validate if the in-memory index has data
    if (!inMemoryIndex || !inMemoryIndex.data || inMemoryIndex.data.length === 0) {
      return res.status(500).json({ error: "No data available in the index. Please try again later." });
    }

    // Filter the in-memory data to match any of the NPI values
    const results = inMemoryIndex.data.filter((item) => {
      if (!item || !item.NPI) return false;
      return npiList.includes(item.NPI.toString());
    });

    // Pagination logic
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedResults = results.slice(offset, offset + parseInt(limit, 10));

    // Respond with the matching results and pagination metadata
    res.status(200).json({
      results: paginatedResults,
      pagination: {
        totalRecords: results.length,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(results.length / limit),
        pageSize: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error processing multiple search:", error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

module.exports = router;
