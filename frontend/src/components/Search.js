import React, { useState } from "react";
import axios from "axios";
import Results from "./Results";
import "./Search.css"; // Import the CSS file

const Search = () => {
    const [searchTerm, setSearchTerm] = useState(""); // Search input value
    const [results, setResults] = useState([]); // API results
    const [type, setType] = useState(""); // Result type (exact, suggested, etc.)
    const [searchType, setSearchType] = useState("direct"); // Default search type
    const [city, setCity] = useState("All");


    // Handle Direct Search
    const handleDirectSearch = async () => {
        if (!searchTerm) {
            alert("Please enter a search term!");
            return;
        }

        try {
            const response = await axios.get("http://localhost:5000/search/direct", {
                params: { term: searchTerm, city: city },
            });

            setResults(response.data.results);
            setType(response.data.type);
        } catch (err) {
            console.error("Error fetching direct search results:", err);
            alert("An error occurred while performing direct search. Please try again.");
        }
    };

    // Handle Multiple Search
    const handleMultipleSearch = async () => {
        if (!searchTerm) {
            alert("Please enter a search term!");
            return;
        }

        try {
            const response = await axios.get("http://localhost:5000/search/multiple", {
                params: { term: searchTerm, city: city },
            });

            setResults(response.data.results);
            setType(response.data.type);
        } catch (err) {
            console.error("Error fetching multiple search results:", err);
            alert("An error occurred while performing multiple search. Please try again.");
        }
    };

    // Handle Smart Search
    const handleSmartSearch = async () => {
        if (!searchTerm) {
            alert("Please enter a search term!");
            return;
        }

        try {
            const response = await axios.get("http://localhost:5000/search/smart", {
                params: { term: searchTerm, city: city },
            });

            console.log("Smart Search Response:", response.data);

            // Update results state with exact and suggested arrays
            setResults({
                exact: response.data.type === "exact" ? response.data.results : [],
                suggested: response.data.type === "suggested" ? response.data.results : [],
            });
            setType("smart");
        } catch (err) {
            console.error("Error fetching smart search results:", err);
            alert("An error occurred while performing smart search. Please try again.");
        }
    };

    // Execute the appropriate search function based on the selected search type
    const handleSearch = () => {
        if (searchType === "direct") {
            handleDirectSearch();
        } else if (searchType === "multiple") {
            handleMultipleSearch();
        } else if (searchType === "smart") {
            handleSmartSearch();
        } else {
            alert("Invalid search type selected.");
        }
    };

    return (
        <div className="search-bar">
            <div className="search-controls">
                <button
                    className={`search-type-button ${searchType === "direct" ? "active" : ""}`}
                    onClick={() => setSearchType("direct")}
                >
                    Direct Search
                </button>
                <button
                    className={`search-type-button ${searchType === "smart" ? "active" : ""}`}
                    onClick={() => setSearchType("smart")}
                >
                    Smart Search
                </button>
                <button
                    className={`search-type-button ${searchType === "multiple" ? "active" : ""}`}
                    onClick={() => setSearchType("multiple")}
                >
                    Multiple Search
                </button>
            </div>

            {/* Search Input and Button */}
            <div className="search-inputs">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Enter search term"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    onChange={(e) => setCity(e.target.value)}
                    className="city-select"
                >
                    <option value="All">All</option>
                    <option value="United States">United States</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Italy">Italy</option>
                    <option value="France">France</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Netherlands">Netherlands</option>
                </select>
                <button className="search-button" onClick={handleSearch}>
                    Search
                </button>
            </div>

            {/* Display Results */}
            <div className="results-section">
                <Results type={type} results={results} searchTerm={searchTerm} />
            </div>
        </div>
    );
};

export default Search;
