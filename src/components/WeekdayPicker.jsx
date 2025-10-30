import React from 'react';

const WeekdayPicker = ({ value, onChange }) => {
  const weekdays = [
    { code: 0, name: 'Mon' },
    { code: 1, name: 'Tue' },
    { code: 2, name: 'Wed' },
    { code: 3, name: 'Thu' },
    { code: 4, name: 'Fri' },
    { code: 5, name: 'Sat' },
    { code: 6, name: 'Sun' }
  ];

  const handleChange = (code) => {
    const newValue = [...value];
    const index = newValue.indexOf(code);
    
    if (index === -1) {
      newValue.push(code);
    } else {
      newValue.splice(index, 1);
    }
    
    onChange(newValue);
  };

  return (
    <div className="weekday-picker">
      <label>Select Days:</label>
      <div className="weekday-buttons">
        {weekdays.map(day => (
          <button
            key={day.code}
            type="button"
            className={value.includes(day.code) ? 'selected' : ''}
            onClick={() => handleChange(day.code)}
          >
            {day.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekdayPicker;
