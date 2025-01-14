import React from "react";
import SearchBar from "./components/SearchBar";
import './App.css';
import logo from './logo.png'; // Replace with your logo image file

function App() {
    return (
        <div className="App">
            <header className="app-header">
                <img src={logo} alt="Vector Health Logo" className="logo" />
                <h1>HCP Search</h1>
            </header>
            <main>
                <SearchBar />
            </main>
        </div>
    );
}

export default App;
