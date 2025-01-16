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
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 results per page

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Calculate the starting row for pagination
        const offset = (page - 1) * limit;

        // Base query with pagination
        const baseQuery = `
            FROM hcp_search_20250106
            WHERE (HCP_first_name = @searchTerm
                OR HCP_last_name = @searchTerm
                OR practice_address = @searchTerm)
        `;

        // Add `practice_city` filter if provided
        if (practice_city && practice_city !== "All") {
            baseQuery += ` AND practice_city = @practice_city`;
        }

        // Query for retrieving paginated results
        const query = `
            SELECT *
            FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY HCP_last_name) AS row_num, *
                ${baseQuery}
            ) AS paginated
            WHERE row_num BETWEEN @offset + 1 AND @offset + @limit
        `;

        // Query for total count
        const countQuery = `
            SELECT COUNT(*) AS total
            ${baseQuery}
        `;

        // Add parameters
        request.input("searchTerm", sql.NVarChar, searchTerm);
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        if (practice_city && practice_city !== "All") {
            request.input("practice_city", sql.NVarChar, practice_city);
        }

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

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();

        // Split the search term into individual words
        const terms = searchTerm.split(",").map((term) => term.trim());

        // Base condition for exact match query
        const exactCondition = terms
            .map(
                (term, index) =>
                    `(HCP_first_name = @term${index} OR HCP_last_name = @term${index} OR practice_city = @term${index})`
            )
            .join(" OR ");

        // Base condition for suggested match query
        const suggestedCondition = terms
            .map(
                (term, index) =>
                    `(HCP_first_name LIKE '%' + @term${index} + '%' OR HCP_last_name LIKE '%' + @term${index} + '%' OR practice_city LIKE '%' + @term${index} + '%')`
            )
            .join(" OR ");

        // Add city filter if specified
        const cityFilter = city !== "All" ? "AND practice_city = @city" : "";

        // Exact match query
        const exactQuery = `
            SELECT * 
            FROM hcp_search_20250106 
            WHERE (${exactCondition}) ${cityFilter}
        `;

        // Suggested match query
        const suggestedQuery = `
            SELECT * 
            FROM hcp_search_20250106 
            WHERE (${suggestedCondition}) ${cityFilter}
              AND NOT (${exactCondition})
        `;

        // Bind parameters for terms
        terms.forEach((term, index) => {
            request.input(`term${index}`, sql.NVarChar, term);
        });

        // Bind city parameter if applicable
        if (city !== "All") {
            request.input("city", sql.NVarChar, city);
        }

        // Execute exact match query
        const exactResult = await request.query(exactQuery);

        // If exact matches exist, return them
        if (exactResult.recordset.length > 0) {
            return res.json({
                type: "exact",
                results: exactResult.recordset,
            });
        }

        // Execute suggested match query
        const suggestedResult = await request.query(suggestedQuery);

        // Return suggested matches if no exact matches exist
        res.json({
            type: "suggested",
            results: suggestedResult.recordset,
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