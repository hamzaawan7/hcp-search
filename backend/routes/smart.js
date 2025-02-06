const levenshtein = require('fast-levenshtein');
const express = require("express");
const fs = require("fs");
const path = require("path"); // ✅ Add this line
const router = express.Router();

const dataDir = "./Data"; // Directory where JSON files are stored
const indexFilePath = path.join(dataDir, "index.json"); // Path to the index file

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

router.get("/suggested", (req, res) => {
    let { page = 1, limit = 10, exactPage = 1, exactLimit = 10, country, ...filters } = req.query;

    // Field mapping for search
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

    // Filter out empty fields
    const filledFields = Object.entries(filters)
        .filter(([_, value]) => value.trim() !== "")
        .map(([key, value]) => ({
            key: fieldMapping[key] || key,
            value: value.toLowerCase(),
        }));

    if (filledFields.length === 0) {
        return res.status(400).json({ error: "At least one search field must be filled." });
    }

    // Read data from all JSON files
    const inMemoryIndex = readFromJsonFiles();
    console.log(`🔍 Searching for:`, filledFields);

    // Filter data by country if provided
    let filteredData = country
        ? inMemoryIndex.data.filter(
            (item) => item.Country && item.Country.toLowerCase() === country.toLowerCase()
        )
        : inMemoryIndex.data;

    // Find exact matches
    let exactMatches = filteredData.filter((item) => {
        return filledFields.every(({ key, value }) =>
            item[key] && item[key].toString().toLowerCase() === value.toLowerCase()
        );
    }).map((item) => ({
        ...item,
        similarity: "100.00%",
    }));

    // Paginate exact matches
    const paginatedExactMatches = paginateResults(exactMatches, exactPage, exactLimit);

    // Prepare data for fuzzy search
    let fuzzySearchData = filteredData.filter((item) => !exactMatches.includes(item));

    // Perform fuzzy search
    let fuzzyResults = [];
    fuzzySearchData.forEach((item) => {
        let totalFields = filledFields.length;
        let totalLevenScore = 0;
        filledFields.forEach(({ key, value }) => {
            if (item[key]) {
                const itemValue = item[key].toString().toLowerCase();
                const searchValue = value.toLowerCase();
                const maxLen = Math.max(itemValue.length, searchValue.length);
                if (maxLen > 0) {
                    const levenDistance = levenshtein.get(itemValue, searchValue);
                    const similarity = 1 - (levenDistance / maxLen); // Normalize similarity to [0,1]
                    totalLevenScore += similarity;
                }
            }
        });
        if (totalFields > 0) {
            let similarityScore = (totalLevenScore / totalFields) * 100;
            fuzzyResults.push({
                ...item,
                similarity: similarityScore,
            });
        }
    });

    // Sort fuzzy results by similarity
    fuzzyResults.sort((a, b) => b.similarity - a.similarity);
    fuzzyResults = fuzzyResults.map(item => ({
        ...item,
        similarity: item.similarity.toFixed(2) + "%"
    }));

    // Remove duplicates
    const uniqueResults = Array.from(new Map(fuzzyResults.map((item) => [item.NPI, item])).values());

    // Filter suggested matches (similarity between 51% and 99.99%)
    const suggestedMatches = uniqueResults.filter((item) => parseFloat(item.similarity) < 100.0 && parseFloat(item.similarity) >= 51);

    // Paginate suggested matches
    const paginatedSuggestedMatches = paginateResults(suggestedMatches, page, limit);

    // Return response
    res.status(200).json({
        exactMatches: paginatedExactMatches.results,
        suggestedMatches: paginatedSuggestedMatches.results,
        exactPagination: paginatedExactMatches.pagination,
        suggestedPagination: paginatedSuggestedMatches.pagination,
    });
});
module.exports = router;
