import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/material_blue.css';

const TimePickerFlatpickr = ({ value, onChange, label }) => {
    const handleChange = (selectedDates) => {
        if (selectedDates && selectedDates[0]) {
            const date = selectedDates[0];
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            onChange(`${hours}:${minutes}`);
        }
    };

    // Convert HH:MM string to Date object for Flatpickr
    const getDateFromTime = (timeString) => {
        if (!timeString) return new Date();
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date;
    };

    return (
        <Flatpickr
            value={getDateFromTime(value)}
            onChange={handleChange}
            options={{
                enableTime: true,
                noCalendar: true,
                dateFormat: 'H:i',
                time_24hr: true,
                minuteIncrement: 15,
                defaultHour: 0,
                defaultMinute: 0,
            }}
            className="form-input"
            placeholder="Seleziona orario"
        />
    );
};

export default TimePickerFlatpickr;
