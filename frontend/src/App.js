import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Search from "./components/Search";
import Details from "./components/Details";
import DirectSearch from "./components/DirectSearch"
import logo from './logo.png';

function App() {
    return (
        <Router>
            <div className="App">
                <header className="app-header">
                    <img src={logo} alt="Vector Health Logo" className="logo" style={{    marginLeft: "41%", marginTop:"15px", height: "70px"}} />
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={<DirectSearch />} />
                        <Route path="/details/:npi" element={<Details />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
