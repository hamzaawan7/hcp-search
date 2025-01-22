import React, { useState, useEffect } from "react";
import axios from "axios";
import Results from "./Results";
import "../components/Search.css";
import { TailSpin } from "react-loader-spinner";
import { useNavigate, useLocation } from "react-router-dom";

const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchType, setSearchType] = useState("direct");
    const [searchTerm, setSearchTerm] = useState("");
    const [country, setCountry] = useState("All");
    const [results, setResults] = useState([]);
    const [exact, setExact] = useState([]);
    const [suggested, setSuggested] = useState([]);
    const [fuzzy, setFuzzy] = useState([]); // State for fuzzy results
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
    const [fuzzyPagination, setFuzzyPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        pageSize: 5,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const querySearchType = queryParams.get("type") || "smart";
        const querySearchTerm = queryParams.get("term") || "";
        const queryCountry = queryParams.get("country") || "All";
    
        setSearchType(querySearchType);
        setSearchTerm(querySearchTerm);
        setCountry(queryCountry);
    
        // Restore results if state is available
        if (location.state) {
            const {
                results = [],
                exact = [],
                suggested = [],
                fuzzy = [],
                pagination = { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 5 },
                exactPagination = { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 5 },
                suggestedPagination = { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 5 },
                fuzzyPagination = { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 5 },
            } = location.state;
    
            setResults(results);
            setExact(exact);
            setSuggested(suggested);
            setFuzzy(fuzzy);
            setPagination(pagination);
            setExactPagination(exactPagination);
            setSuggestedPagination(suggestedPagination);
            setFuzzyPagination(fuzzyPagination);
        } else if (querySearchTerm) {
            // Perform a fresh search if no state is available
            handleSearch(1);
        }
    }, [location]);
    const handleSearch = async (page = 1, limit = 5) => {
        if (loading) return;
        setLoading(true);
        try {
            const params = { term: searchTerm, country, page, limit };
            const newUrl = `?type=${searchType}&term=${searchTerm}&country=${country}`;
            navigate(newUrl, { replace: true });

            if (searchType === "smart") {
                // Fetch exact matches
                const exactResponse = await axios.get("http://localhost:5000/search/smart/exact", { params });
                setExact(exactResponse.data.results || []);
                setExactPagination(exactResponse.data.pagination || {});

                // Fetch suggested matches
                const suggestedResponse = await axios.get("http://localhost:5000/search/smart/suggested", { params });
                setSuggested(suggestedResponse.data.results || []);
                setSuggestedPagination(suggestedResponse.data.pagination || {});

                // Fetch fuzzy matches
                const fuzzyResponse = await axios.get("http://localhost:5000/search/smart/fuzzy", { params });
                setFuzzy(fuzzyResponse.data.results || []);
                setFuzzyPagination(fuzzyResponse.data.pagination || {});

            } else if (searchType === "direct") {
                const response = await axios.get("http://localhost:5000/search/direct", { params });
                setResults(response.data.results || []);
                setPagination(response.data.pagination || {});
                setExact([]);
                setSuggested([]);
                setFuzzy([]);
            } else if (searchType === "multiple") {
                const response = await axios.get("http://localhost:5000/search/multiple", { params });
                setResults(response.data.results || []);
                setPagination(response.data.pagination || {});
                setExact([]);
                setSuggested([]);
                setFuzzy([]);
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

    const handleFuzzyPageChange = (newPage) => {
        if (newPage > 0 && newPage <= fuzzyPagination.totalPages) {
            handleSearch(newPage, fuzzyPagination.pageSize);
        }
    };

    return (
        <div className="search-bar">
            <div className="search-controls">
                <button
                    className={`search-type-button ${searchType === "smart" ? "active" : ""}`}
                    onClick={() => setSearchType("smart")}
                    disabled={loading}
                >
                    Smart Search
                </button>
                <button
                    className={`search-type-button ${searchType === "direct" ? "active" : ""}`}
                    onClick={() => setSearchType("smart")}
                    disabled={loading}
                >
                    Direct Search
                </button>
                <button
                    className={`search-type-button ${searchType === "multiple" ? "active" : ""}`}
                    onClick={() => setSearchType("multiple")}
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    fuzzy={fuzzy}
                    searchTerm={searchTerm}
                    pagination={pagination}
                    exactPagination={exactPagination}
                    suggestedPagination={suggestedPagination}
                    fuzzyPagination={fuzzyPagination}
                    onPageChange={handlePageChange}
                    onExactPageChange={handleExactPageChange}
                    onSuggestedPageChange={handleSuggestedPageChange}
                    onFuzzyPageChange={handleFuzzyPageChange}
                />
            )}
        </div>
    );
};

export default Search;
