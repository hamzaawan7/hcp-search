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
    "user": "VH", // Database username
    "password": "VectorHealth@123", // Database password
    "server": "vectorhealth.crrixukeivct.us-east-2.rds.amazonaws.com", // Server IP address
    "database": "vector_health", // Database name
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
    new sql.Request().query("SELECT TOP(10) * FROM hcp_search_20250106", (err, result) => {
        console.log("Query executed successfully");
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
    const practice_city = req.query.city;
    const country = req.query.country; // Get country filter from request
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 results per page

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Calculate the starting row for pagination
        const offset = (page - 1) * limit;

        // Base query
        let baseCondition = `
            WHERE (HCP_first_name = @searchTerm
                OR HCP_last_name = @searchTerm
                OR practice_address = @searchTerm)
        `;

        // Add `practice_city` filter if provided
        if (practice_city && practice_city !== "All") {
            baseCondition += ` AND practice_city = @practice_city`;
            request.input("practice_city", sql.NVarChar, practice_city);
        }

        // Add `practice_country` filter if provided
        if (country && country !== "All") {
            baseCondition += ` AND country = @country`;
            request.input("country", sql.NVarChar, country);
        }

        // Query for retrieving paginated results
        const query = `
            SELECT *
            FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY HCP_last_name) AS row_num, *
                FROM hcp_search_20250106
                ${baseCondition}
            ) AS paginated
            WHERE row_num BETWEEN @offset + 1 AND @offset + @limit
        `;

        // Query for total count
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM hcp_search_20250106
            ${baseCondition}
        `;

        // Add parameters
        request.input("searchTerm", sql.NVarChar, searchTerm);
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        // Execute both queries
        const [result, countResult] = await Promise.all([
            request.query(query),
            request.query(countQuery),
        ]);

        const totalRecords = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // Send response
        res.json({
            type: "results",
            results: result.recordset,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (err) {
        console.error("Error executing direct search query:", err);
        res.status(500).send("An error occurred while searching.");
    }
});









app.get("/search/multiple", async (req, res) => {
    const searchTerm = req.query.term;
    const practiceCity = req.query.city;
    const country = req.query.country; 

    // Validate the search term
    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        // Parse the search term into multiple IDs
        const NPIs = searchTerm
            .split(",")
            .map((NPI) => NPI.trim()) // Trim whitespace
            .filter((NPI) => /^\d+$/.test(NPI)); // Keep only numeric IDs (regex validation)

        // If no valid NPIs, return an error
        if (NPIs.length === 0) {
            return res
                .status(400)
                .send({ error: "Invalid or no valid IDs provided for multiple search." });
        }

        // Start building the query
        let query = `
            SELECT * 
            FROM hcp_search_20250106
            WHERE NPI IN (${NPIs.map((_, index) => `@NPI${index}`).join(",")})
        `;

        // Add city filter if provided
        if (practiceCity && practiceCity !== "All") {
            query += ` AND practice_city = @practiceCity`;
        }
        if (country && country !== "All") {
            baseCondition += ` AND country = @country`;
            request.input("country", sql.NVarChar, country);
        }

        // Create a SQL request
        const request = new sql.Request();

        // Add parameters for each NPI
        NPIs.forEach((NPI, index) => {
            request.input(`NPI${index}`, sql.Int, parseInt(NPI, 10));
        });

        // Add the city parameter if specified
        if (practiceCity && practiceCity !== "All") {
            request.input("practiceCity", sql.NVarChar, practiceCity);
        }

        // Execute the query
        const result = await request.query(query);

        // Return the results
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
    const city = req.query.city || "All"; // Default to "All" if not specified
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 results per page

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Split the search term into individual words
        const terms = searchTerm.split(",").map((term) => term.trim());

        // Exact match condition
        const exactCondition = terms
            .map(
                (term, index) =>
                    `(HCP_first_name = @term${index} OR HCP_last_name = @term${index} OR country = @term${index} OR practice_city = @term${index})`
            )
            .join(" OR ");

        // Suggested match condition
        const suggestedCondition = terms
            .map(
                (term, index) =>
                    `(HCP_first_name LIKE '%' + @term${index} + '%' OR HCP_last_name LIKE '%' + @term${index} + '%' OR country LIKE '%' + @term${index} + '%' OR practice_city LIKE '%' + @term${index} + '%')`
            )
            .join(" OR ");

        // Add city filter if specified
        const cityFilter = city !== "All" ? "AND practice_city = @city" : "";

        // Exact match query
        const exactQuery = `
            SELECT * 
            FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY HCP_last_name) AS row_num, *
                FROM hcp_search_20250106 
                WHERE (${exactCondition}) ${cityFilter}
            ) AS paginated
            WHERE row_num BETWEEN @offset + 1 AND @offset + @limit;
        `;

        // Suggested match query
        const suggestedQuery = `
            SELECT * 
            FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY HCP_last_name) AS row_num, *
                FROM hcp_search_20250106 
                WHERE (${suggestedCondition}) ${cityFilter}
                  AND NOT (${exactCondition})
            ) AS paginated
            WHERE row_num BETWEEN @offset + 1 AND @offset + @limit;
        `;

        // Total count query for suggested matches
        const suggestedCountQuery = `
            SELECT COUNT(*) AS total
            FROM hcp_search_20250106 
            WHERE (${suggestedCondition}) ${cityFilter}
              AND NOT (${exactCondition});
        `;

        // Bind terms as parameters
        terms.forEach((term, index) => {
            request.input(`term${index}`, sql.NVarChar, term);
        });

        // Bind city parameter
        if (city !== "All") {
            request.input("city", sql.NVarChar, city);
        }

        // Bind pagination parameters
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        // Execute exact match query
        const exactResult = await request.query(exactQuery);

        if (exactResult.recordset.length > 0) {
            // Return exact matches
            return res.json({
                type: "exact",
                results: exactResult.recordset,
                pagination: {
                    totalRecords: exactResult.recordset.length,
                    currentPage: page,
                    pageSize: limit,
                },
            });
        }

        // Execute suggested match queries
        const [suggestedResult, suggestedCountResult] = await Promise.all([
            request.query(suggestedQuery),
            request.query(suggestedCountQuery),
        ]);

        const totalSuggestedRecords = suggestedCountResult.recordset[0].total;
        const totalSuggestedPages = Math.ceil(totalSuggestedRecords / limit);

        // Return suggested matches
        res.json({
            type: "suggested",
            results: suggestedResult.recordset,
            pagination: {
                totalRecords: totalSuggestedRecords,
                totalPages: totalSuggestedPages,
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (err) {
        console.error("Error executing smart search query:", err);
        res.status(500).send({ error: "An error occurred while searching." });
    }
});










// Start the server on port 5000
app.listen(5000, () => {
    console.log("Listening on port 5000...");
});