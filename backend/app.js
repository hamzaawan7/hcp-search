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
    const country = req.query.country; // Get country filter from request
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = 5;  // Default to 10 results per page

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
                OR practice_address = @searchTerm
                OR practice_city = @searchTerm)
        `;

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

app.get("/search/direct/detail/:npi", async (req, res) => {
    const { npi } = req.params;

    // Validate the NPI parameter
    if (!npi || isNaN(npi)) {
        return res.status(400).send({ error: "Invalid or missing NPI parameter." });
    }

    try {
        const request = new sql.Request();
        const query = `
            SELECT 
                Provider_Credential_Text,
                Provider_Name_Prefix_Text,
                practice_postal_code,
                mailing_address,
                mailing_city,
                mailing_st,
                mailing_postal_code,
                Taxonomy_Code,
                License_Number,
                Provider_License_State,
                Specialty_1,
                Specialty_2,
                Specialty_3
            FROM hcp_search_20250106
            WHERE NPI = @npi;
        `;

        request.input("npi", sql.NVarChar, npi);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Return detailed data for the record
        } else {
            res.status(404).send({ error: "No data found for the provided NPI." });
        }
    } catch (err) {
        console.error("Error fetching detailed data:", err);
        res.status(500).send("An error occurred while fetching detailed data.");
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

        // Add `practice_country` filter if provided
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

app.get("/search/smart/exact", async (req, res) => {
    const searchTerm = req.query.term;
    const country = req.query.country; // Get country filter from request
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    try {
        const request = new sql.Request();
        const offset = (page - 1) * limit;

        // Exact match query with pagination
        const exactQuery =` 
            SELECT *
            FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY HCP_last_name) AS row_num, *
                FROM hcp_search_20250106
                WHERE HCP_first_name = @term OR HCP_last_name = @term OR country = @term
            ) AS paginated
            WHERE row_num BETWEEN @offset + 1 AND @offset + @limit;
        `;

                // Add `practice_country` filter if provided
        if (country && country !== "All") {
            baseCondition += ` AND country = @country`;
            request.input("country", sql.NVarChar, country);
        }

        // Count query for pagination
        const countQuery =` 
            SELECT COUNT(*) AS totalRecords
            FROM hcp_search_20250106
            WHERE HCP_first_name = @term OR HCP_last_name = @term OR country = @term;
        `;

        // Input parameters for the query
        request.input("term", sql.NVarChar, searchTerm);
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        // Run both the exact search query and count query
        const [result, countResult] = await Promise.all([
            request.query(exactQuery),
            request.query(countQuery),
        ]);

        const totalRecords = countResult.recordset[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        res.json({
            results: result.recordset,
            pagination: {
                totalRecords,
                currentPage: page,
                totalPages,
                pageSize: limit,
            },
        });
    } catch (err) {
        console.error("Error fetching exact matches:", err);
        res.status(500).send({ error: "An error occurred while fetching exact matches." });
    }
});


app.get("/search/smart/suggested", async (req, res) => {
    const searchTerm = req.query.term;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const country = req.query.country; // Get country filter from request

    

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    // Debugging: Log the search term received
    console.log("Search term received:", searchTerm);

    try {
        const request = new sql.Request();
        const offset = (page - 1) * limit;


        // Suggested match query with pagination
        const suggestedQuery = `
            SELECT *
            FROM (
                SELECT ROW_NUMBER() OVER (ORDER BY HCP_last_name) AS row_num, *
                FROM hcp_search_20250106
                WHERE practice_city LIKE @term OR practice_st LIKE @term OR practice_address = @term

            ) AS paginated
            WHERE row_num BETWEEN @offset + 1 AND @offset + @limit;
        `;

                // Add `practice_country` filter if provided
        if (country && country !== "All") {
            baseCondition += ` AND country = @country`;
            request.input("country", sql.NVarChar, country);
        }


        // Count query to get the total number of matching records
        const countQuery = `
            SELECT COUNT(*) AS totalRecords
            FROM hcp_search_20250106
            WHERE 
                practice_city LIKE @term OR 
                practice_address LIKE @term OR 
                practice_st LIKE @term;
        `;


        // Add parameters for the search term and pagination
        request.input("term", sql.NVarChar, searchTerm);
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        // Execute both queries
        const [result, countResult] = await Promise.all([
            request.query(suggestedQuery),
            request.query(countQuery),
        ]);

        // Get the total number of records and calculate total pages
        const totalRecords = countResult.recordset[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // Return the results with pagination information
        res.json({
            results: result.recordset,
            pagination: {
                totalRecords,
                currentPage: page,
                totalPages,
                pageSize: limit,
            },
        });

    } catch (err) {
        // Debugging: Log the error details
        console.error("Error in suggested API:", err);
        res.status(500).send({ error: "An error occurred while fetching suggested matches." });
    }
});

// Define the fuzzy search route
app.get("/search/smart/fuzzy", async (req, res) => {
    const searchTerm = req.query.term;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!searchTerm) {
        return res.status(400).send({ error: "Search term is required." });
    }

    console.log("Search term received (fuzzy search):", searchTerm);

    try {
        const request = new sql.Request();
        const offset = (page - 1) * limit;

        // Fuzzy match query with pagination
        const fuzzyQuery = `
                SELECT *
                FROM hcp_search_20250106
                WHERE 
                    CHARINDEX(@term, practice_address) > 0 OR
                    SOUNDEX(practice_city) = SOUNDEX(@term) OR
                    SOUNDEX(practice_st) = SOUNDEX(@term);

        `;

        // Count query to get total matching records
        const countQuery = `
            SELECT COUNT(*) AS totalRecords
            FROM hcp_search_20250106
            WHERE 
                practice_city LIKE '%' + @term + '%' OR
                practice_st LIKE '%' + @term + '%' OR
                practice_address LIKE '%' + @term + '%';
        `;

        // Add parameters for the search term and pagination
        request.input("term", sql.NVarChar, searchTerm);
        request.input("offset", sql.Int, offset);
        request.input("limit", sql.Int, limit);

        // Execute the queries
        const [result, countResult] = await Promise.all([
            request.query(fuzzyQuery),
            request.query(countQuery),
        ]);

        // Get total records and calculate total pages
        const totalRecords = countResult.recordset[0]?.totalRecords || 0;
        const totalPages = Math.ceil(totalRecords / limit);

        // Return the results with pagination info
        res.json({
            results: result.recordset,
            pagination: {
                totalRecords,
                currentPage: page,
                totalPages,
                pageSize: limit,
            },
        });
    } catch (err) {
        console.error("Error in fuzzy search API:", err);
        res.status(500).send({ error: "An error occurred while performing the fuzzy search." });
    }
});



// Start the server on port 5000
app.listen(5000, () => {
    console.log("Listening on port 5000...");
});