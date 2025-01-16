import React, { useState } from "react";
import "./Results.css";

const Results = ({ type, results = [], searchTerm = "", pagination = {}, onPageChange }) => {
    // Provide default values for destructuring
    const { currentPage = 1, totalPages = 1 } = pagination;

    // State to handle expanded rows
    const [expandedRow, setExpandedRow] = useState(null);

    // Common fields to display by default
    const commonFields = ["NPI", "HCP_first_name", "HCP_last_name", "practice_address", "practice_city"];
    // All fields (including additional fields to show on expand)
    const allFields = [
        "NPI",
        "HCP_first_name",
        "HCP_last_name",
        "practice_address",
        "practice_city",
        "Provider_Credential_Text",
        "Provider_Name_Prefix_Text",
        "practice_st",
        "practice_postal_code",
        "mailing_address",
        "mailing_city",
        "mailing_st",
        "mailing_postal_code",
        "Taxonomy_Code",
        "License_Number",
        "Provider_License_State",
        "Specialty_1",
        "Specialty_2",
        "Specialty_3",
        "Country",
    ];

    const toggleExpandRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

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

    const renderTableRows = (data) =>
        data.map((result, index) => (
            <React.Fragment key={result.NPI}>
                {/* Common fields row */}
                <tr>
                    {commonFields.map((field) => (
                        <td key={field}>{result[field]}</td>
                    ))}
                    <td>
                        <button
                            className="view-button"
                            onClick={() => toggleExpandRow(index)}
                        >
                            {expandedRow === index ? "Hide" : "View"}
                        </button>
                    </td>
                </tr>
                {/* Expanded row for additional fields */}
                {expandedRow === index && (
                    <tr className="expanded-row">
                        <td colSpan={commonFields.length + 1}>
                            <div className="details-container">
                                <h4>Additional Details</h4>
                                <ul>
                                    {allFields.map(
                                        (field) =>
                                            !commonFields.includes(field) && (
                                                <li key={field}>
                                                    <strong>{field.replace("_", " ")}:</strong>{" "}
                                                    {result[field] || "N/A"}
                                                </li>
                                            )
                                    )}
                                </ul>
                            </div>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        ));

    return (
        <div>
            <h3>Search Results</h3>
            {type === "smart" ? (
                <div>
                    <h4>Exact Matches</h4>
                    {results.exact?.length > 0 ? (
                        <table className="results-table">
                            <thead>
                                <tr>
                                    {commonFields.map((field) => (
                                        <th key={field}>{field.replace("_", " ")}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableRows(results.exact)}
                            </tbody>
                        </table>
                    ) : (
                        <p>No exact matches found.</p>
                    )}

                    <h4>Suggested Matches</h4>
                    {results.suggested?.length > 0 ? (
                        <table className="results-table">
                            <thead>
                                <tr>
                                    {commonFields.map((field) => (
                                        <th key={field}>{field.replace("_", " ")}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableRows(results.suggested)}
                            </tbody>
                        </table>
                    ) : (
                        <p>No suggested matches found.</p>
                    )}
                </div>
            ) : (
                results.length > 0 ? (
                    <table className="results-table">
                        <thead>
                            <tr>
                                {commonFields.map((field) => (
                                    <th key={field}>{field.replace("_", " ")}</th>
                                ))}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows(results)}
                        </tbody>
                    </table>
                ) : (
                    <p>No results found for "{searchTerm}".</p>
                )
            )}
            {renderPaginationControls()}
        </div>
    );
};

export default Results;
