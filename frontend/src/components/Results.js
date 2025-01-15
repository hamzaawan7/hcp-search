import React from "react";
import "./Results.css";

const Results = ({ type, results, searchTerm }) => {
    if (type === "smart") {
        return (
            <div>
                <h3>Exact Results</h3>
                {results.exact && results.exact.length > 0 ? (
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Address</th>
                                <th>City</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.exact.map((result) => (
                                <tr key={result.ID}>
                                    <td>{result.ID}</td>
                                    <td>{result.FirstName}</td>
                                    <td>{result.LastName}</td>
                                    <td>{result.Address}</td>
                                    <td>{result.City}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No exact matches found for "{searchTerm}".</p>
                )}

                <h3>Suggested Results</h3>
                {results.suggested && results.suggested.length > 0 ? (
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Address</th>
                                <th>City</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.suggested.map((result) => (
                                <tr key={result.ID}>
                                    <td>{result.ID}</td>
                                    <td>{result.FirstName}</td>
                                    <td>{result.LastName}</td>
                                    <td>{result.Address}</td>
                                    <td>{result.City}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No suggested matches found.</p>
                )}
            </div>
        );
    }

    // Handle direct and multiple search results
    return (
        <div>
            <h3>Search Results</h3>
            {Array.isArray(results) && results.length > 0 ? (
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Address</th>
                            <th>City</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result) => (
                            <tr key={result.ID}>
                                <td>{result.ID}</td>
                                <td>{result.FirstName}</td>
                                <td>{result.LastName}</td>
                                <td>{result.Address}</td>
                                <td>{result.City}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No results found for "{searchTerm}".</p>
            )}
        </div>
    );
};

export default Results;
