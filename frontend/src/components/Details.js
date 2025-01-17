import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Details = () => {
    const { npi } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/search/direct/detail/${npi}`);
                setDetails(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching details:", err);
                setLoading(false);
            }
        };
        fetchDetails();
    }, [npi]);

    if (loading) {
        return <p>Loading details...</p>;
    }

    if (!details) {
        return <p>No details found for NPI: {npi}</p>;
    }

    return (
        <div className="details-container">
            <h3>Details for NPI: {npi}</h3>
            <ul>
                {Object.entries(details).map(([key, value]) => (
                    <li key={key}>
                        <strong>{key.replace(/_/g, " ")}:</strong> {value || "N/A"}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Details;
