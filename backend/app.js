const express = require("express");
const sql = require("mssql");
const cors = require("cors"); 

const app = express();
app.use(
    cors({
        origin: "http://localhost:3000", // Allow only requests from this origin
    })
);

// SQL Server configuration
var config = {
    "user": "root", // Database username
    "password": "m.h_mughal14", // Database password
    "server": "localhost", // Server IP address
    "database": "hcp_search", // Database name
    "options": {
        "encrypt": false // Disable encryption
    }
}

// Connect to SQL Server
sql.connect(config, err => {
    if (err) {
        throw err;
    }
    console.log("Connection Successful!");
});

// Define route for fetching data from SQL Server
app.get("/", (req, res) => {
    // Execute a SELECT query
    new sql.Request().query("SELECT * FROM Users", (err, result) => {
        if (err) {
            console.error("Error executing query:", err);
        } else {
            res.send(result.recordset); // Send query result as response
            console.dir(result.recordset);
        }
    });
});

app.get("/search/direct", async (req, res) => {
    const searchTerm = req.query.term;
    const city = req.query.city;

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Add the basic query
        let query = `
            SELECT * 
            FROM Users 
            WHERE (firstname = @searchTerm
                OR lastname = @searchTerm
                OR address = @searchTerm
                OR city = @searchTerm)
        `;

        // If a specific city is selected, add a city filter
        if (city && city !== "All") {
            query += ` AND city = @city`;
            request.input("city", sql.NVarChar, city);
        }

        // Add search term parameter
        request.input("searchTerm", sql.NVarChar, searchTerm);

        // Execute the query
        const result = await request.query(query);

        res.json({
            type: "results",
            results: result.recordset,
        });
    } catch (err) {
        console.error("Error executing direct search query:", err);
        res.status(500).send("An error occurred while searching.");
    }
});





app.get("/search/multiple", async (req, res) => {
    const searchTerm = req.query.term;
    const city = req.query.city;

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Parse the search term into multiple IDs
        const ids = searchTerm
            .split(",")
            .map((id) => id.trim())
            .filter((id) => !isNaN(id));

        if (ids.length === 0) {
            return res.status(400).send({ error: "Invalid IDs provided for multiple search." });
        }

        // Construct the base query
        let query = `
            SELECT * 
            FROM Users 
            WHERE ID IN (${ids.join(",")})
        `;

        // Add city filter if specified
        if (city && city !== "All") {
            query += ` AND city = @city`;
            request.input("city", sql.NVarChar, city);
        }

        const result = await request.query(query);

        res.json({
            type: "results",
            results: result.recordset,
        });
    } catch (err) {
        console.error("Error executing multiple search query:", err);
        res.status(500).send("An error occurred while searching.");
    }
});


app.get("/search/smart", async (req, res) => {
    const searchTerm = req.query.term;
    const city = req.query.city;

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Split the search term into individual words
        const terms = searchTerm.split(",").map((term) => term.trim());

        // Construct the exact match query
        let exactQuery = `
            SELECT * 
            FROM Users 
            WHERE (${terms
                .map(
                    (term, index) =>
                        `(firstname = @term${index} OR lastname = @term${index} OR address = @term${index} OR city = @term${index})`
                )
                .join(" OR ")})
        `;

        // Construct the suggested match query
        let suggestedQuery = `
            SELECT * 
            FROM Users 
            WHERE (${terms
                .map(
                    (term, index) =>
                        `(firstname LIKE '%' + @term${index} + '%' OR lastname LIKE '%' + @term${index} + '%' OR address LIKE '%' + @term${index} + '%' OR city LIKE '%' + @term${index} + '%')`
                )
                .join(" OR ")})
              AND NOT (${terms
                  .map(
                      (term, index) =>
                          `(firstname = @term${index} OR lastname = @term${index} OR address = @term${index} OR city = @term${index})`
                  )
                  .join(" OR ")})
        `;

        // Add error-tolerant match query using SOUNDEX
        let errorQuery = `
            SELECT *
            FROM Users
            WHERE (${terms
                .map(
                    (term, index) =>
                        `(SOUNDEX(firstname) = SOUNDEX(@term${index}) OR SOUNDEX(lastname) = SOUNDEX(@term${index}))`
                )
                .join(" OR ")})
        `;

        // Add city filter if specified
        if (city && city !== "All") {
            exactQuery += ` AND city = @city`;
            suggestedQuery += ` AND city = @city`;
            errorQuery += ` AND city = @city`;
            request.input("city", sql.NVarChar, city);
        }

        // Bind parameters for terms
        terms.forEach((term, index) => {
            request.input(`term${index}`, sql.NVarChar, term);
        });

        // Execute exact match query
        const exactResult = await request.query(exactQuery);

        if (exactResult.recordset.length > 0) {
            return res.json({
                type: "exact",
                results: exactResult.recordset,
            });
        }

        // Execute suggested match query
        const suggestedResult = await request.query(suggestedQuery);

        // Execute error-tolerant query
        const errorResult = await request.query(errorQuery);

        // Mark error-tolerant results
        errorResult.recordset.forEach((item) => (item.isErrorTolerant = true));

        // Combine suggested and error-tolerant results, removing duplicates
        const combinedSuggestedResults = [
            ...suggestedResult.recordset,
            ...errorResult.recordset,
        ];
        const uniqueSuggestedResults = Array.from(
            new Map(combinedSuggestedResults.map((item) => [item.ID, item]))
        ).map(([_, value]) => value); // Extract values from the map

        res.json({
            type: "suggested",
            results: uniqueSuggestedResults,
        });
    } catch (err) {
        console.error("Error executing smart search query:", err);
        res.status(500).send("An error occurred while searching.");
    }
});



// Start the server on port 5000
app.listen(5000, () => {
    console.log("Listening on port 5000...");
});