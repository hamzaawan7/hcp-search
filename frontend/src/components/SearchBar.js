import React, { useState } from "react";
import axios from "axios";
import './SearchBar.css'; // Add styles here

const SearchBar = () => {
    const [searchType, setSearchType] = useState("Smart Search");
    const [query, setQuery] = useState("");
    const [country, setCountry] = useState("All");
    const [exactMatches, setExactMatches] = useState([]);
    const [secondaryMatches, setSecondaryMatches] = useState([]);

    const handleSearch = () => {
        axios
            .get("http://localhost:4000/api/hcp-search", {
                params: { query, searchType, country },
            })
            .then((response) => {
                setExactMatches(response.data.exactMatches);
                setSecondaryMatches(response.data.secondaryMatches);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    };

    return (
        <div className="search-bar">
            <div className="search-controls">
                <button
                    className={`search-type-button ${
                        searchType === "Smart Search" ? "active" : ""
                    }`}
                    onClick={() => setSearchType("Smart Search")}
                >
                    Smart Search
                </button>
                <button
                    className={`search-type-button ${
                        searchType === "Direct Search" ? "active" : ""
                    }`}
                    onClick={() => setSearchType("Direct Search")}
                >
                    Direct Search
                </button>
                <button
                    className={`search-type-button ${
                        searchType === "Multiple Search" ? "active" : ""
                    }`}
                    onClick={() => setSearchType("Multiple Search")}
                >
                    Multiple Search
                </button>
            </div>
            <div className="search-inputs">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Enter query for ${searchType}`}
                    className="search-input"
                />
                <select
                    onChange={(e) => setCountry(e.target.value)}
                    className="country-select"
                >
                    <option value="All">All</option>
                    <option value="United States">United States</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Italy">Italy</option>
                    <option value="France">France</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Netherlands">Netherlands</option>
                </select>
                <button onClick={handleSearch} className="search-button">
                    Search
                </button>
            </div>

            <div className="results-section">
                <h3>Exact Matches</h3>
                {exactMatches.length > 0 ? (
                    <table className="results-table">
                        <thead>
                        <tr>
                            {Object.keys(exactMatches[0]).map((key) => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {exactMatches.map((match, index) => (
                            <tr key={index}>
                                {Object.values(match).map((value, i) => (
                                    <td key={i}>{value}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No exact matches found</p>
                )}

                <h3>Suggested Matches</h3>
                {secondaryMatches.length > 0 ? (
                    <table className="results-table">
                        <thead>
                        <tr>
                            {Object.keys(secondaryMatches[0]).map((key) => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {secondaryMatches.map((match, index) => (
                            <tr key={index}>
                                {Object.values(match).map((value, i) => (
                                    <td key={i}>{value}</td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No secondary matches found</p>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
