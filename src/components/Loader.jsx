// Salva come: src/components/Loader.jsx

import React from 'react';
import '../styles/loader.css'; // Creeremo questo file tra un attimo

const Loader = ({ text = "Caricamento..." }) => {
    return (
        <div className="loader-container">
            <div className="loader-spinner"></div>
            <p className="loader-text">{text}</p>
        </div>
    );
};

export default Loader;