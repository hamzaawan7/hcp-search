import React from "react";
import { Link } from "react-router-dom";
import "./Results.css";

const Results = ({
    type,
    results = [],
    exact = [],
    suggested = [],
    fuzzy = [], // Added fuzzy results
    searchTerm = "",
    pagination = {},
    onPageChange,
    exactPagination = {},
    onExactPageChange,
    suggestedPagination = {},
    onSuggestedPageChange,
    fuzzyPagination = {}, // Added fuzzy pagination
    onFuzzyPageChange, // Added fuzzy pagination handler
}) => {
    // Function to render the table with data
    const renderTable = (data, title) => (
        <div>
            <h3>{title}</h3>
            <table className="results-table">
                <thead>
                    <tr>
                        {commonFields.map((field) => (
                            <th key={field}>{fieldDisplayNames[field]}</th>
                        ))}
                        <th>Action</th> {/* Add Action column for View button */}
                    </tr>
                </thead>
                <tbody>
                    {data.map((result, index) => (
                        <tr key={index}>
                            {commonFields.map((field) => (
                                <td key={field}>{result[field] || "N/A"}</td>
                            ))}
                            <td>
                                {/* Add View button with Link for navigation */}
                                <Link
                                to={`/details/${result.NPI}`}
                                state={{
                                    previousPage: window.location.pathname, // Current page path
                                    searchTerm, // Pass the current search term
                                    pagination, // Pass current pagination state
                                    exact, // Pass exact matches if available
                                    suggested, // Pass suggested matches if available
                                    fuzzy, // Pass fuzzy matches if available
                                    results, // Pass the current search results
                                    currentPage: pagination.currentPage || 1, // Pass the current page
                                }}
                            >
                                    <button className="view-button">View</button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Function to render pagination controls
    const renderPaginationControls = (currentPage, totalPages, onPageChange) => (
        <div className="pagination-controls">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );

    // Display names for table columns
    const fieldDisplayNames = {
        NPI: "NPI Number",
        HCP_first_name: "First Name",
        HCP_last_name: "Last Name",
        practice_address: "Practice Address",
        practice_city: "City",
        practice_st: "State",
        Country: "Country",
    };

    // Common fields to display in the table
    const commonFields = [
        "NPI",
        "HCP_first_name",
        "HCP_last_name",
        "practice_address",
        "practice_city",
        "practice_st",
        "Country",
    ];

    return (
        <div>
            <h2>Search Results for "{searchTerm}"</h2>
            {type === "smart" ? (
                <>
                    {exact.length > 0 && (
                        <>
                            {renderTable(exact, "Exact Match")}
                            {renderPaginationControls(
                                exactPagination.currentPage || 1,
                                exactPagination.totalPages || 1,
                                onExactPageChange
                            )}
                        </>
                    )}

                    {suggested.length > 0 && (
                        <>
                            {renderTable(suggested, "Suggested Match")}
                            {renderPaginationControls(
                                suggestedPagination.currentPage || 1,
                                suggestedPagination.totalPages || 1,
                                onSuggestedPageChange
                            )}
                        </>
                    )}

                    {fuzzy.length > 0 && (
                        <>
                            {renderTable(fuzzy, "Fuzzy Match")} {/* Render fuzzy matches */}
                            {renderPaginationControls(
                                fuzzyPagination.currentPage || 1,
                                fuzzyPagination.totalPages || 1,
                                onFuzzyPageChange
                            )}
                        </>
                    )}

                    {exact.length === 0 && suggested.length === 0 && fuzzy.length === 0 && (
                        <p>No results found for "{searchTerm}".</p>
                    )}
                </>
            ) : (
                <>
                    {results.length > 0 ? (
                        <>
                            {renderTable(results, "Results")}
                            {renderPaginationControls(
                                pagination.currentPage || 1,
                                pagination.totalPages || 1,
                                onPageChange
                            )}
                        </>
                    ) : (
                        <p>No results found for "{searchTerm}".</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Results;
