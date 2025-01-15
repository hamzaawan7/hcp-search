import React from "react";
import Search from "./components/Search";
import logo from './logo.png';

function App() {
    return (
        <div className="App">
            <header className="app-header">
                <img src={logo} alt="Vector Health Logo" className="logo" />
            </header>
            <main>
                <Search />
            </main>
        </div>
    );
}

export default App;
