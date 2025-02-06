const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dataDirectory = "./Data"; // Directory containing multiple JSON files

const readFromJsonFiles = () => {
  try {
    const files = fs.readdirSync(dataDirectory);
    let aggregatedData = [];

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const filePath = path.join(dataDirectory, file);
        const data = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(data);

        if (jsonData && Array.isArray(jsonData.data)) {
          aggregatedData = aggregatedData.concat(jsonData.data);
        }
      }
    });

    return { data: aggregatedData };
  } catch (err) {
    console.error("Error reading from JSON files:", err);
    return { data: [] };
  }
};

router.get("/multiple", (req, res) => {
  const { term, page = 1, limit = 10 } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Search term is required." });
  }

  try {
    const npiList = term.split(",").map((id) => id.trim());
    const inMemoryIndex = readFromJsonFiles();

    if (!inMemoryIndex || !inMemoryIndex.data || inMemoryIndex.data.length === 0) {
      return res.status(500).json({ error: "No data available in the index. Please try again later." });
    }

    const results = inMemoryIndex.data.filter((item) => {
      if (!item || !item.NPI) return false;
      return npiList.includes(item.NPI.toString());
    });

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedResults = results.slice(offset, offset + parseInt(limit, 10));

    res.status(200).json({
      results: paginatedResults,
      pagination: {
        totalRecords: results.length,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(results.length / parseInt(limit, 10)),
        pageSize: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error processing multiple search:", error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

module.exports = router;
