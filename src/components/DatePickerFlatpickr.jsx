import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/material_blue.css';

const DatePickerFlatpickr = ({ value, onChange, minDate }) => {
    const handleChange = (selectedDates) => {
        if (selectedDates && selectedDates[0]) {
            const date = selectedDates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        }
    };

    // Convert YYYY-MM-DD string to Date object for Flatpickr
    const getDateFromString = (dateString) => {
        if (!dateString) return new Date();
        return new Date(dateString);
    };

    return (
        <Flatpickr
            value={getDateFromString(value)}
            onChange={handleChange}
            options={{
                dateFormat: 'Y-m-d',
                minDate: minDate || new Date(),
                locale: {
                    firstDayOfWeek: 1, // Monday
                    weekdays: {
                        shorthand: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
                        longhand: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
                    },
                    months: {
                        shorthand: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
                        longhand: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
                    }
                }
            }}
            className="form-input"
            placeholder="Seleziona data"
        />
    );
};

export default DatePickerFlatpickr;
