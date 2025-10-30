import React from 'react';

const RecurrencePicker = ({ value, onChange }) => {
  const options = [
    '1 Mese', 
    '3 Mesi', 
    '6 Mesi', 
    '1 Anno', 
    '2 Anni', 
    'domenica', 
    'weekend'
  ];

  return (
    <div className="recurrence-picker">
      <label>Downtime Recurrence:</label>
      <div className="recurrence-options">
        {options.map(option => (
          <label key={option} className="radio-label">
            <input
              type="radio"
              name="recurrence"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
};

export default RecurrencePicker;
