import React, { useState } from "react";
import axios from "axios";
import Results from "./Results";
import "../components/Search.css";

const Search = () => {
    const [searchType, setSearchType] = useState("direct");
    const [searchTerm, setSearchTerm] = useState("");
    const [country, setCountry] = useState("All");
    const [results, setResults] = useState([]);
    const [type, setType] = useState("");
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        pageSize: 10, // Ensure pageSize is always defined
    });

    const handleSearch = async (page = 1, limit = pagination.pageSize || 10) => {
        if (!searchTerm.trim()) {
            alert("Please enter a valid search term!");
            return;
        }

        try {
            let response;

            if (searchType === "direct") {
                response = await axios.get("http://localhost:5000/search/direct", {
                    params: { term: searchTerm, country, page, limit },
                });
            } else if (searchType === "smart") {
                response = await axios.get("http://localhost:5000/search/smart", {
                    params: { term: searchTerm, country, page, limit },
                });

                setResults({
                    exact: response.data.type === "exact" ? response.data.results : [],
                    suggested: response.data.type === "suggested" ? response.data.results : [],
                });
                setType("smart");
                setPagination(
                    response.data.pagination || {
                        currentPage: page,
                        totalPages: 1,
                        totalRecords: 0,
                        pageSize: limit,
                    }
                );
                return;
            } else if (searchType === "multiple") {
                response = await axios.get("http://localhost:5000/search/multiple", {
                    params: { term: searchTerm, country, page, limit },
                });
            }

            if (response) {
                setResults(response.data.results || []);
                setType(response.data.type);
                setPagination(
                    response.data.pagination || {
                        currentPage: page,
                        totalPages: 1,
                        totalRecords: 0,
                        pageSize: limit,
                    }
                );
            }
        } catch (err) {
            console.error(`Error fetching ${searchType} search results:`, err);
            alert(`An error occurred while performing the ${searchType} search.`);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            handleSearch(newPage, pagination.pageSize);
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

            <div className="search-inputs">
                <input
                    type="text"
                    placeholder="Enter search term"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="All">All</option>
                    <option value="US">United States</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Italy">Italy</option>
                    <option value="France">France</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Netherlands">Netherlands</option>
                </select>
                <button onClick={() => handleSearch(1)}>Search</button>
            </div>

            <Results
                type={type}
                results={results}
                searchTerm={searchTerm}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default Search;
