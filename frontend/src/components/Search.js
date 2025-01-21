import React, { useState, useEffect } from "react";
import axios from "axios";
import Results from "./Results";
import "../components/Search.css";
import { TailSpin } from "react-loader-spinner";
import { useNavigate, useLocation } from "react-router-dom";

const Search = () => {
    const navigate = useNavigate();
    const location = useLocation(); // To capture the current URL and query params
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
    const [loading, setLoading] = useState(false); // Flag to track the loading status

    // Use location to track the URL parameters
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const querySearchType = queryParams.get("type") || "direct";
        const querySearchTerm = queryParams.get("term") || "";
        const queryCountry = queryParams.get("country") || "All";

        setSearchType(querySearchType);
        setSearchTerm(querySearchTerm);
        setCountry(queryCountry);

        if (querySearchTerm) {
            handleSearch(1);
        }
    }, [location]);

    // Updated handleSearch function with loading flag
    const handleSearch = async (page = 1, limit = 5) => {
        if (loading) return; // Prevent multiple requests if a request is already in progress

        setLoading(true);
        try {
            const params = { term: searchTerm, country, page, limit };
            let response;

            // Update the URL dynamically with search params
            const newUrl = `?type=${searchType}&term=${searchTerm}&country=${country}`;
            navigate(newUrl, { replace: true });

            if (searchType === "direct") {
                response = await axios.get("http://localhost:5000/search/direct", { params });
                setResults(response.data.results || []);
                setPagination(response.data.pagination || {});
                setExact([]);
                setSuggested([]);
            } else if (searchType === "smart") {
                // Fetch exact matches
                const exactResponse = await axios.get("http://localhost:5000/search/smart/exact", { params });
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
            setLoading(false); // Reset the loading flag after the request is complete
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
                    disabled={loading} // Disable button when loading
                >
                    Direct Search
                </button>
                <button
                    className={`search-type-button ${searchType === "smart" ? "active" : ""}`}
                    onClick={() => setSearchType("smart")}
                    disabled={loading} // Disable button when loading
                >
                    Smart Search
                </button>
                <button
                    className={`search-type-button ${searchType === "multiple" ? "active" : ""}`}
                    onClick={() => setSearchType("multiple")}
                    disabled={loading} // Disable button when loading
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
                    disabled={loading} // Disable input when loading
                />
                <select value={country} onChange={(e) => setCountry(e.target.value)} disabled={loading}>
                    <option value="All">All</option>
                    <option value="US">United States</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Italy">Italy</option>
                    <option value="France">France</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Netherlands">Netherlands</option>
                </select>
                <button
                    onClick={() => handleSearch(1)}
                    disabled={loading} // Disable button when loading
                >
                    Search
                </button>
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
