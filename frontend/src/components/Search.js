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
    const [exact, setExact] = useState([]);
    const [suggested, setSuggested] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        pageSize: 5,
    });
    const [exactPagination, setExactPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        pageSize: 5,
    });
    const [suggestedPagination, setSuggestedPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        pageSize: 5,
    });
    const [loading, setLoading] = useState(false);

    const handleSearch = async (page = 1, limit = 5) => {
        setLoading(true);
        try {
            const params = { term: searchTerm, country, page, limit };
            let response;

            if (searchType === "direct") {
                response = await axios.get("http://localhost:5000/search/direct", { params });
                setResults(response.data.results || []);
                setPagination(response.data.pagination || {});
                setExact([]);
                setSuggested([]);
            } else if (searchType === "smart") {
                // Fetch exact matches
                const exactResponse = await axios.get("http://localhost:5000/search/smart/exact", { params });
                console.log(params); // Log the parameters to verify the term is correct
                setExact(exactResponse.data.results || []);
                setExactPagination(exactResponse.data.pagination || {});

                const suggestedResponse = await axios.get("http://localhost:5000/search/smart/suggested", { params });
                setSuggested(suggestedResponse.data.results || []);
                setSuggestedPagination(suggestedResponse.data.pagination || {});
            } else if (searchType === "multiple") {
                response = await axios.get("http://localhost:5000/search/multiple", { params });
                setResults(response.data.results || []);
                setPagination(response.data.pagination || {});
                setExact([]);
                setSuggested([]);
            }
        } catch (err) {
            console.error(`Error fetching ${searchType} search results:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            handleSearch(newPage, pagination.pageSize);
        }
    };

    const handleExactPageChange = (newPage) => {
        if (newPage > 0 && newPage <= exactPagination.totalPages) {
            handleSearch(newPage, exactPagination.pageSize);
        }
    };

    const handleSuggestedPageChange = (newPage) => {
        if (newPage > 0 && newPage <= suggestedPagination.totalPages) {
            handleSearch(newPage, suggestedPagination.pageSize);
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
                    <TailSpin height="80" width="80" color="#4fa94d" />
                </div>
            ) : (
                <Results
                    type={searchType}
                    results={results}
                    exact={exact}
                    suggested={suggested}
                    searchTerm={searchTerm}
                    pagination={pagination}
                    exactPagination={exactPagination}
                    suggestedPagination={suggestedPagination}
                    onPageChange={handlePageChange}
                    onExactPageChange={handleExactPageChange}
                    onSuggestedPageChange={handleSuggestedPageChange}
                />
            )}
        </div>
    );
};

export default Search;
