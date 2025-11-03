import React from 'react';

// --- MODIFICATO ---
// Abbiamo rimosso Sabato e Domenica
const days = [
    { label: 'L', value: 0 }, // Lunedì
    { label: 'M', value: 1 }, // Martedì
    { label: 'M', value: 2 }, // Mercoledì
    { label: 'G', value: 3 }, // Giovedì
    { label: 'V', value: 4 }  // Venerdì
];

const WeekdayPicker = ({ value = [], onChange }) => {
    
    const toggleDay = (dayValue) => {
        if (value.includes(dayValue)) {
            // Rimuovi il giorno
            onChange(value.filter(d => d !== dayValue));
        } else {
            // Aggiungi il giorno
            onChange([...value, dayValue].sort((a, b) => a - b));
        }
    };

    return (
        <div className="weekday-picker">
            {days.map(day => (
                <button
                    type="button" // Previene il submit del form
                    key={day.value}
                    className={`day-button ${value.includes(day.value) ? 'selected' : ''}`}
                    onClick={() => toggleDay(day.value)}
                >
                    {day.label}
                </button>
            ))}
        </div>
    );
};

export default WeekdayPicker;