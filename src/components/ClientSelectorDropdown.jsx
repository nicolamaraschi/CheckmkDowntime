import React from 'react';
import Select from 'react-select';
import { useApi } from '../hooks/useApi';

const ClientSelectorDropdown = ({ selectedClients, setSelectedClients }) => {
    const { data, loading, error } = useApi('clients');

    // Transform data into react-select format
    const options = React.useMemo(() => {
        if (!data) return [];
        return data.map(client => ({
            value: client,
            label: client
        }));
    }, [data]);

    // Transform selected values
    const selectedValues = React.useMemo(() => {
        if (!selectedClients) return [];
        return selectedClients.map(client => ({
            value: client,
            label: client
        }));
    }, [selectedClients]);

    const handleChange = (selected) => {
        const values = selected ? selected.map(option => option.value) : [];
        setSelectedClients(values);
    };

    // Custom styles for react-select
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '42px',
            borderColor: state.isFocused ? '#4F46E5' : '#9ca3af',
            borderWidth: '2px',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
            '&:hover': {
                borderColor: '#4F46E5'
            }
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#E0E7FF',
            borderRadius: '6px',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#4338CA',
            fontWeight: '500',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#4338CA',
            ':hover': {
                backgroundColor: '#4338CA',
                color: 'white',
            },
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#4F46E5' : state.isFocused ? '#E0E7FF' : 'white',
            color: state.isSelected ? 'white' : '#111827',
            fontWeight: state.isSelected ? '500' : '400',
            ':active': {
                backgroundColor: '#4F46E5',
            },
        }),
    };

    if (loading) {
        return (
            <Select
                isDisabled
                placeholder="Caricamento clienti..."
                styles={customStyles}
            />
        );
    }

    if (error) {
        return (
            <Select
                isDisabled
                placeholder={`Errore: ${error}`}
                styles={customStyles}
            />
        );
    }

    return (
        <Select
            isMulti
            options={options}
            value={selectedValues}
            onChange={handleChange}
            placeholder="Seleziona uno o più clienti..."
            noOptionsMessage={() => "Nessun cliente trovato"}
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
        />
    );
};

export default ClientSelectorDropdown;
