import React from 'react';

const TimePicker = ({ label, value, onChange }) => {
  return (
    <div className="time-picker">
      <label>{label}:</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TimePicker;
