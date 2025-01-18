import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Results.css";

const Results = ({ type, results = [], searchTerm = "", pagination = {}, onPageChange }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Use initial state from location.state if available
    const initialState = location.state || {};
    const currentResults = initialState.results || results;
    const currentSearchTerm = initialState.searchTerm || searchTerm;
    const currentPagination = initialState.pagination || pagination;

    const { currentPage = 1, totalPages = 1 } = currentPagination;

    // Field display names mapping
    const fieldDisplayNames = {
        NPI: "NPI Number",
        HCP_first_name: "First Name",
        HCP_last_name: "Last Name",
        practice_address: "Practice Address",
        practice_city: "City",
        practice_st: "State",
        practice_postal_code: "Postal Code",
        Provider_Credential_Text: "Provider Credentials",
        Provider_Name_Prefix_Text: "Name Prefix",
        mailing_address: "Mailing Address",
        mailing_city: "Mailing City",
        mailing_st: "Mailing State",
        mailing_postal_code: "Mailing Postal Code",
        Taxonomy_Code: "Taxonomy Code",
        License_Number: "License Number",
        Provider_License_State: "License State",
        Specialty_1: "Specialty 1",
        Specialty_2: "Specialty 2",
        Specialty_3: "Specialty 3",
        Country: "Country",
    };

    const commonFields = ["NPI", "HCP_first_name", "HCP_last_name", "practice_address", "practice_st", "Country"];

    const renderPaginationControls = () => (
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

    const handleViewDetails = (npi) => {
        navigate(`/details/${npi}`, {
            state: {
                previousPage: location.pathname,
                searchTerm: currentSearchTerm,
                results: currentResults,
                pagination: currentPagination,
            },
        });
    };

    const renderTableRows = (data) =>
        data.map((result) => (
            <tr key={result.NPI}>
                {commonFields.map((field) => (
                    <td key={field}>{result[field]}</td>
                ))}
                <td>
                    <button
                        className="view-button"
                        onClick={() => handleViewDetails(result.NPI)}
                    >
                        View
                    </button>
                </td>
            </tr>
        ));

    return (
        <div>
            <h3>Search Results</h3>
            {currentResults.length > 0 ? (
                <table className="results-table">
                    <thead>
                    <tr>
                        {commonFields.map((field) => (
                            <th key={field}>{fieldDisplayNames[field] || field}</th>
                        ))}
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>{renderTableRows(currentResults)}</tbody>
                </table>
            ) : (
                <p>No results found for "{currentSearchTerm}".</p>
            )}

            {renderPaginationControls()}
        </div>
    );
};

export default Results;
