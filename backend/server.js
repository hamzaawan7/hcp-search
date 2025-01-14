const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database.");
    }
});

// Route to fetch data
app.get("/api/hcp-search", (req, res) => {
    const { query, searchType, country } = req.query;

    if (searchType !== "Smart Search" || !query) {
        return res.status(400).json({ error: "Invalid search type or query" });
    }

    const terms = query.split(" "); // Split query into words
    let exactMatchSql = "SELECT * FROM hcp_table WHERE address = ?";
    let secondaryMatchSql = `
        SELECT * FROM hcp_table 
        WHERE address LIKE ? 
        AND address != ?
    `;
    const exactMatchParams = [query];
    const secondaryMatchParams = [`%${terms.join("%")}%`, query];

    if (country && country !== "All") {
        exactMatchSql += " AND country = ?";
        secondaryMatchSql += " AND country = ?";
        exactMatchParams.push(country);
        secondaryMatchParams.push(country);
    }

    const results = { exactMatches: [], secondaryMatches: [] };

    // Query exact matches
    db.query(exactMatchSql, exactMatchParams, (err, exactResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        results.exactMatches = exactResults;

        // Query secondary matches
        db.query(secondaryMatchSql, secondaryMatchParams, (err, secondaryResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            results.secondaryMatches = secondaryResults;
            res.json(results);
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
