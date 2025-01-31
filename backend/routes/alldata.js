const express = require('express');
const fs = require('fs');
const router = express.Router();

const dataFilePath = "/Users/test/Sites/hcp-search/backend/jobs/data2.json"; // Path to your JSON file
const readFromJsonFile = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return { data: [] };
  } catch (err) {
    console.error("Error reading from JSON file:", err);
    return { data: [] };
  }
};
router.get('/all-data', (req, res) => {
  try {
    const data = readFromJsonFile();
    if (data.data.length === 0) {
      return res.status(200).json({ message: "No data found in the file." });
    }
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
