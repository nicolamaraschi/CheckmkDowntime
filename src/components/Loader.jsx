import React from 'react';
import '../styles/loader.css';

const Loader = ({ text = "Caricamento..." }) => {
    return (
        <div className="loader-container">
            <div className="loader-spinner"></div>
            <p className="loader-text">{text}</p>
        </div>
    );
};

export default Loader;