import React, { useState } from "react";
import "./Results.css";

const Results = ({ type, results = [], searchTerm = "", pagination = {}, onPageChange }) => {
    const { currentPage = 1, totalPages = 1 } = pagination;
    const [expandedRow, setExpandedRow] = useState(null);

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

    const commonFields = ["NPI", "HCP_first_name", "HCP_last_name", "practice_address", "Country"];
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
                                                    <strong>{fieldDisplayNames[field] || field}:</strong>{" "}
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
                                        <th key={field}>{fieldDisplayNames[field] || field}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>{renderTableRows(results.exact)}</tbody>
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
                                        <th key={field}>{fieldDisplayNames[field] || field}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>{renderTableRows(results.suggested)}</tbody>
                        </table>
                    ) : (
                        <p>No suggested matches found.</p>
                    )}
                </div>
            ) : results.length > 0 ? (
                <table className="results-table">
                    <thead>
                        <tr>
                            {commonFields.map((field) => (
                                <th key={field}>{fieldDisplayNames[field] || field}</th>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>{renderTableRows(results)}</tbody>
                </table>
            ) : (
                <p>No results found for "{searchTerm}".</p>
            )}
            {renderPaginationControls()}
        </div>
    );
};

export default Results;
