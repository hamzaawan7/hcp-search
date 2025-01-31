import React, { useState } from "react";
import axios from "axios";
import "./DirectSearch.css";

const DirectSearchPage = () => {
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    npi: "",
    specialty: "",
    state: "",
    city: "",
  });
  const [showMultipleSearch, setShowMultipleSearch] = useState(false);
  const [multipleSearchTerm, setMultipleSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [exactMatches, setExactMatches] = useState([]);
  const [country, setCountry] = useState();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 10,
  });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupRowIndex, setPopupRowIndex] = useState(null);
  const [aiMatching, setAiMatching] = useState(false);

  const stateCities = {
    // ... (your stateCities object)
  };

  const specialities = [
    // ... (your specialities array)
  ];

  const toggleSearchMode = () => {
    setShowMultipleSearch(!showMultipleSearch);
    clearForm();
  };

  const handleMultipleSearch = async (page = 1) => {
    if (!multipleSearchTerm.trim()) {
      alert("Please enter at least one NPI for multiple search.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/search/multiple", {
        params: {
          term: multipleSearchTerm,
          page,
          limit: pagination.pageSize,
        },
      });
      setResults(data.results || []);
      setPagination(data.pagination || {});
      setExactMatches([]);
      setSearchPerformed(true);
    } catch (err) {
      console.error("Error fetching multiple search results:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAiMatching = () => {
    setAiMatching(!aiMatching);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setFormData({ ...formData, state });
    setCities(stateCities[state] || []);
  };

  const handleSearch = async (page = 1) => {
    if (showMultipleSearch) {
      await handleMultipleSearch(page);
      return;
    }

    const filteredParams = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== "")
    );
    if (Object.keys(filteredParams).length === 0) {
      alert("Please fill in at least one field before searching.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = aiMatching
          ? "http://localhost:5000/search/smart/suggested"
          : "http://localhost:5000/search/direct";
      const queryParams = {
        ...filteredParams,
        page,
        limit: pagination.pageSize,
      };
      const { data } = await axios.get(endpoint, { params: queryParams });
      console.log(data); // Log the response to inspect the data structure

      if (aiMatching) {
        setExactMatches(data.exactMatches || []);
        setResults(data.suggestedMatches || []);
      } else {
        setResults(data.results || []);
        setExactMatches([]);
      }
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 10 });
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleCountryChange = (selectedCountry) => {
    setCountry(selectedCountry);
    handleSearch(1);
  };

  const handleView = async (record, index) => {
    try {
      if (popupRowIndex === index) {
        setPopupRowIndex(null);
        setSelectedRecord(null);
        return;
      }
      const { data } = await axios.get(
          `http://localhost:5000/search/direct/view/${record.NPI}`
      );
      setSelectedRecord(data.record);
      setPopupRowIndex(index);
    } catch (err) {
      console.error("Error fetching details:", err);
    }
  };

  const clearForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      address: "",
      npi: "",
      specialty: "",
      state: "",
      city: "",
    });
    setMultipleSearchTerm("");
    setResults([]);
    setExactMatches([]);
    setSearchPerformed(false);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      pageSize: 10,
    });
  };

  return (
      <div className="direct-search-container">
        <header className="header">
          <h1>HCP Search</h1>
          <button className="toggle-search-mode" onClick={toggleSearchMode}>
            {showMultipleSearch ? "Direct Search" : "Multiple Search"}
          </button>
        </header>
        <div className="language-selection">
          <button
              className={`language-button ${country === "All" ? "active" : ""}`}
              onClick={() => handleCountryChange("All")}
          >
            <img src="/images/planet-earth.png" alt="Global" /> All
          </button>

          <button
              className={`language-button ${country === "US" ? "active" : ""}`}
              onClick={() => handleCountryChange("US")}
          >
            <img src="/images/US.png" alt="US Flag" /> United States
          </button>

          <button
              className={`language-button ${country === "Italy" || country === "ITA" ? "active" : ""}`}
              onClick={() => handleCountryChange("Italy")}
          >
            <img src="/images/italy.png" alt="Italy Flag" /> Italy
          </button>

          <button
              className={`language-button ${country === "Portugal" || country === "PRT" ? "active" : ""}`}
              onClick={() => handleCountryChange("Portugal")}
          >
            <img src="/images/portugal.png" alt="Portugal Flag" /> Portugal
          </button>

          <button
              className={`language-button ${country === "France" || country === "FRA" ? "active" : ""}`}
              onClick={() => handleCountryChange("France")}
          >
            <img src="/images/france.png" alt="France Flag" /> France
          </button>

          <button
              className={`language-button ${country === "Belgium" || country === "BEL" ? "active" : ""}`}
              onClick={() => handleCountryChange("Belgium")}
          >
            <img src="/images/belgium.png" alt="Belgium Flag" /> Belgium
          </button>

          <button
              className={`language-button ${country === "Netherland" || country === "NED" ? "active" : ""}`}
              onClick={() => handleCountryChange("Netherland")}
          >
            <img src="/images/netherlands.png" alt="Netherland Flag" /> Netherland
          </button>

        </div>
        {!showMultipleSearch && (
            <div className="toggle-container">
              <span className="toggle-label">ADVANCE AI MATCHING</span>
              <div
                  className={`toggle-button ${aiMatching ? "active" : ""}`}
                  onClick={toggleAiMatching}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>
        )}
        {loading && <div className="loader">Loading...</div>}
        {showMultipleSearch ? (
            <div className="multiple-search-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Enter NPIs (comma-separated)</label>
                  <input
                      value={multipleSearchTerm}
                      onChange={(e) => setMultipleSearchTerm(e.target.value)}
                      placeholder="e.g. 1234567890, 0987654321"
                  />
                </div>
              </div>
            </div>
        ) : (
            <div className="search-form">
              <div className="form-row">
                <div className="form-field">
                  <label>First Name</label>
                  <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter First Name"
                  />
                </div>
                <div className="form-field">
                  <label>Last Name</label>
                  <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter Last Name"
                  />
                </div>
                <div className="form-field">
                  <label>Mailing Address</label>
                  <input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter Mailing Address"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Specialty</label>
                  <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                  >
                    <option value="">Select Specialty</option>
                    {specialities.map((speciality, index) => (
                        <option key={index} value={speciality}>
                          {speciality}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>NPI</label>
                  <input
                      name="npi"
                      value={formData.npi}
                      onChange={handleInputChange}
                      placeholder="Enter NPI"
                  />
                </div>
                <div className="form-field">
                  <label>Mailing State</label>
                  <select
                      name="state"
                      value={formData.state}
                      onChange={handleStateChange}
                  >
                    <option value="">Select Mailing State</option>
                    {Object.keys(stateCities).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Mailing City</label>
                  <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                  >
                    <option value="">Select Mailing City</option>
                    {cities.map((city, index) => (
                        <option key={index} value={city}>
                          {city}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>License State</label>
                  <select
                      name="state"
                      value={formData.state}
                      onChange={handleStateChange}
                  >
                    <option value="">Select Mailing State</option>
                    {Object.keys(stateCities).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                <label>License No</label>
                <input
                    name="license"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter First Name"
                />
              </div>
              </div>
            </div>
        )}
        <div className="actions">
          <button onClick={() => handleSearch(1)}>
            <img src="/images/search.png" alt="Search" /> Search
          </button>
          <button onClick={clearForm}>
            <img src="/images/clear-format.png" alt="Clear" /> Clear
          </button>
        </div>
        {results.length > 0 && (
            <div className="suggestedmatches">
              {aiMatching && <h2>Suggested Matches</h2>}
              <table className="results-table">
                <thead>
                <tr>
                  <th>NPI</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Address</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Specialty</th>
                  {aiMatching && <th>Similarity</th>}
                  <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {results.map((item, index) => (
                    <React.Fragment key={item.NPI}>
                      <tr>
                        <td>{item.NPI}</td>
                        <td>{item.HCP_first_name}</td>
                        <td>{item.HCP_last_name}</td>
                        <td>{item.practice_address}</td>
                        <td>{item.Country}</td>
                        <td>{item.practice_city}</td>
                        <td>{item.practice_st}</td>
                        <td>{item.Specialty_1}</td>
                        {aiMatching && <td>{item.similarity || "N/A"}</td>}
                        <td>
                          <button onClick={() => handleView(item, index)}>View</button>
                        </td>
                      </tr>
                      {popupRowIndex === index && selectedRecord && (
                          <tr className="details-popup">
                            <td colSpan="14">
                              <div className="popup-content">
                                <h3>Details for NPI: {selectedRecord.NPI}</h3>
                                {/* Render additional details here */}
                              </div>
                            </td>
                          </tr>
                      )}
                    </React.Fragment>
                ))}
                </tbody>
              </table>
            </div>
        )}
        {results.length > 0 && (
            <div className="pagination-controls">
              <button
                  disabled={pagination.currentPage === 1}
                  onClick={() => handleSearch(pagination.currentPage - 1)}
              >
                Previous
              </button>
              <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
              <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handleSearch(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
        )}
      </div>
  );
};

export default DirectSearchPage;