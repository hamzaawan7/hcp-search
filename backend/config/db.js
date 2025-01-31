const sql = require("mssql");

const config = {
    user: "VH",
    password: "VectorHealth@123",
    server: "vectorhealth.crrixukeivct.us-east-2.rds.amazonaws.com",
    database: "vector_health",
    options: {
        encrypt: false,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    requestTimeout: 600000,
};

const connectToDB = async () => {
    try {
        return await sql.connect(config);
    } catch (err) {
        console.error("Database connection error:", err);
        throw err;
    }
};

module.exports = connectToDB;