const levenshtein = require('fast-levenshtein');
const express = require("express");
const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const dataFilePath = "D:/web/smart/Jobs/backend/jobs/data2.json";
const readFromJsonFile = () => {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, "utf8");
            return JSON.parse(data);
        }
        return {data: []};
    } catch (err) {
        console.error("Error reading from JSON file:", err);
        return {data: []};
    }
};

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
    let {page = 1, limit = 10, country, ...filters} = req.query;
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
        return res.status(400).json({error: "At least one search field must be filled."});
    }
    const inMemoryIndex = readFromJsonFile();
    console.log(`🔍 Searching for:`, filledFields);
    let exactMatches = [];
    let fuzzySearchData = [];
    let fuzzyResults = [];
    let filteredData = country
        ? inMemoryIndex.data.filter(
            (item) => item.Country && item.Country.toLowerCase() === country.toLowerCase()
        )
        : inMemoryIndex.data;
    exactMatches = filteredData.filter((item) => {
        let totalFields = filledFields.length;
        let matchedFields = filledFields.filter(({key, value}) =>
            item[key] && item[key].toString().toLowerCase() === value
        ).length;
        return matchedFields === totalFields;
    }).map((item) => ({
        ...item,
        similarity: "100.00%",
    }));
    fuzzySearchData = filteredData.filter((item) => !exactMatches.includes(item));
    fuzzySearchData.forEach((item) => {
        let totalFields = filledFields.length;
        let totalLevenScore = 0;
        filledFields.forEach(({key, value}) => {
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
    fuzzyResults.sort((a, b) => b.similarity - a.similarity);
    fuzzyResults = fuzzyResults.map(item => ({
        ...item,
        similarity: item.similarity.toFixed(2) + "%"
    }));
    const uniqueResults = Array.from(new Map(fuzzyResults.map((item) => [item.NPI, item])).values());
    const suggestedMatches = uniqueResults.filter((item) => parseFloat(item.similarity) < 100.0 && parseFloat(item.similarity) >= 51);
    console.log("✅ Exact Matches:", exactMatches.length);
    console.log("🔍 Fuzzy Search Results:", suggestedMatches.length);
    const paginatedFuzzyResults = paginateResults(suggestedMatches, page, limit);
    res.status(200).json({
        exactMatches,
        suggestedMatches: paginatedFuzzyResults.results,
        pagination: paginatedFuzzyResults.pagination,
    });
});

module.exports = router;
