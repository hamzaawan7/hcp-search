import React, { useState } from "react";
import axios from "axios";
import Results from "./Results";
import "../components/Search.css";
import { TailSpin } from "react-loader-spinner";

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
        pageSize: 5,
    });
    const [loading, setLoading] = useState(false); // Loading state

    const handleSearch = async (page = 1, limit = 5) => {
        if (!searchTerm.trim()) {
            alert("Please enter a valid search term!");
            return;
        }
    
        setLoading(true); // Start the loading spinner
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
        } finally {
            setLoading(false); // Stop the loading spinner
        }
    };
    

    const fetchDetails = async (npi) => {
        if (!npi) {
            alert("Invalid NPI provided.");
            return;
        }

        console.log("Fetching details for NPI:", npi); // Debugging log

        try {
            const response = await axios.get(`http://localhost:5000/search/direct/detail/${npi}`);
            const detailedData = response.data;
            setResults((prevResults) => {
                return prevResults.map((result) =>
                    result.NPI === npi ? { ...result, detailedData } : result
                );
            });
        } catch (err) {
            console.error("Error fetching detailed data:", err);
            alert("An error occurred while fetching detailed data.");
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

            {loading ? (
                <div className="loading-container">
                    <TailSpin
                        height="80"
                        width="80"
                        color="#4fa94d"
                        ariaLabel="tail-spin-loading"
                        radius="1"
                        wrapperClass="loader-spinner"
                        visible={true}
                    />
                </div>
            ) : (
                <Results
                    type={type}
                    results={results}
                    searchTerm={searchTerm}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    fetchDetails={fetchDetails} // Pass the full data fetch function
                />
            )}
        </div>
    );
};

export default Search;
