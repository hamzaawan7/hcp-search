import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./Details.css";

const Details = () => {
    const navigate = useNavigate();
    const { npi } = useParams();
    const location = useLocation();
    const previousState = location.state || {};
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await axios.get(`http://3.144.232.139/search/direct/detail/${npi}`);
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
                searchTerm: previousState.searchTerm,
                pagination: previousState.pagination,
                exact: previousState.exact || [],
                suggested: previousState.suggested || [],
                fuzzy: previousState.fuzzy || [],
                results: previousState.results || [],
                currentPage: previousState.currentPage || 1,
            },
        });
    } else {
        navigate("/");
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