const express = require('express');
const fs = require('fs');
const router = express.Router();

// File path for storing the fetched data
const dataFilePath = "D:/web/smart/Jobs/backend/jobs/data2.json"; // Path to your JSON file

// Helper function to read data from the JSON file
const readFromJsonFile = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return { data: [] }; // Return an empty structure if the file doesn't exist
  } catch (err) {
    console.error("Error reading from JSON file:", err);
    return { data: [] }; // Fallback if an error occurs
  }
};

// Route to get all data from the JSON file
router.get('/all-data', (req, res) => {
  try {
    // Read data from JSON file
    const data = readFromJsonFile();
    
    if (data.data.length === 0) {
      return res.status(200).json({ message: "No data found in the file." });
    }

    // Send the data from the JSON file as a response
    res.status(200).json({
      message: "Data retrieved successfully from the JSON file.",
      data: data.data,
    });
  } catch (error) {
    console.error("Error retrieving data from JSON file:", error);
    res.status(500).json({ error: "Unable to retrieve data from JSON file." });
  }
});

module.exports = router;
