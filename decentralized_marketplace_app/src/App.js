import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import HomePage from "./pages/HomePage";
import MarketplacePage from "./pages/MarketplacePage";
import DeveloperDashboardPage from "./pages/DeveloperDashboardPage";
import Header from "./components/common/Header";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Web3Provider>
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/developer" element={<DeveloperDashboardPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </Router>
    </Web3Provider>
  );
}

export default App;
