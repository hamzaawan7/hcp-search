import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./Details.css";

const Details = () => {
    const navigate = useNavigate();
    const { npi } = useParams(); // Get NPI from the URL
    const location = useLocation();
    const previousState = location.state || {}; // Get previous state

    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch details for the specific NPI
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/search/direct/detail/${npi}`);
                setRecord(response.data); // Populate record with fetched data
            } catch (err) {
                setError("Failed to load details.");
            } finally {
                setLoading(false);
            }
        };

        if (npi) {
            fetchDetail();
        } else {
            setError("No valid NPI provided.");
            setLoading(false);
        }
    }, [npi]);

    const handleBackClick = () => {
    // Navigate back to the previous page with preserved state
    if (previousState.previousPage) {
        navigate(previousState.previousPage, {
            state: {
                searchTerm: previousState.searchTerm, // Restore search term
                pagination: previousState.pagination, // Restore pagination state
                exact: previousState.exact || [], // Restore exact results
                suggested: previousState.suggested || [], // Restore suggested results
                fuzzy: previousState.fuzzy || [], // Restore fuzzy results
                results: previousState.results || [], // Restore results
                currentPage: previousState.currentPage || 1, // Restore current page
            },
        });
    } else {
        navigate("/"); // Default fallback to home page
    }
};


    if (loading) {
        return <div className="loading-message">Loading details...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!record) {
        return <div>No data found.</div>;
    }

    return (
        <div className="details-container">
            <button className="back-button" onClick={handleBackClick}>
                Back
            </button>

            <h3>Details for NPI: {npi}</h3>
            <table className="details-table">
                <tbody>
                    {Object.entries(record).map(([key, value]) => (
                        <tr key={key}>
                            <th>{key.replace(/_/g, " ")}</th>
                            <td>{value || "N/A"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Details;
