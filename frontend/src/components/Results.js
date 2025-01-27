import React from "react";
import { Link } from "react-router-dom";
import "./Results.css";

const Results = ({
  type,
  exact = [],
  suggested = [],
  results = [],
  searchTerm = "",
  exactPagination = {},
  onExactPageChange,
  suggestedPagination = {},
  onSuggestedPageChange,
  pagination = {},
  onPageChange,
}) => {
  const getFields = () => [
    "NPI",
    "HCP_first_name",
    "HCP_last_name",
    "practice_address",
    "practice_city",
    "practice_st",
    "Country",
    "similarity",
  ];

  const fieldDisplayNames = {
    NPI: "NPI Number",
    HCP_first_name: "First Name",
    HCP_last_name: "Last Name",
    practice_address: "Practice Address",
    practice_city: "City",
    practice_st: "State",
    Country: "Country",
    similarity: "Similarity",
  };

  const renderTable = (data, title) => {
    const fields = getFields();
    return (
      <div>
        <h3>{title}</h3>
        <table className="results-table">
          <thead>
            <tr>
              {fields.map((field) => (
                <th key={field}>{fieldDisplayNames[field]}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((result, index) => (
              <tr key={index}>
                {fields.map((field) => (
                  <td key={field}>{result[field] || "N/A"}</td>
                ))}
                <td>
                  <Link to={`/details/${result.NPI}`}>
                    <button className="view-button">View</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPaginationControls = (pagination, onPageChange) => {
    const { currentPage = 1, totalPages = 1 } = pagination;

    return (
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
  };

  return (
    <div>
      <h2>Search Results for "{searchTerm}"</h2>
      {type === "smart" && (
        <>
          {exact.length > 0 && (
            <>
              {renderTable(exact, "Exact Matches")}
              {renderPaginationControls(exactPagination, onExactPageChange)}
            </>
          )}
          {suggested.length > 0 && (
            <>
              {renderTable(suggested, "Suggested Matches")}
              {renderPaginationControls(suggestedPagination, onSuggestedPageChange)}
            </>
          )}
          {exact.length === 0 && suggested.length === 0 && (
            <p>No results found for "{searchTerm}".</p>
          )}
        </>
      )}

      {type === "direct" && (
        <>
          {results.length > 0 ? (
            <>
              {renderTable(results, "Direct Search Results")}
              {renderPaginationControls(pagination, onPageChange)}
            </>
          ) : (
            <p>No results found for "{searchTerm}".</p>
          )}
        </>
      )}

      {type === "multiple" && (
        <>
          {results.length > 0 ? (
            <>
              {renderTable(results, "Multiple Search Results")}
              {renderPaginationControls(pagination, onPageChange)}
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
