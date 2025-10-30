import React from 'react';
import { useApi } from '../hooks/useApi';

const HostSelector = ({ selectedHosts, setSelectedHosts }) => {
  const { data: hosts, loading, error } = useApi('/hosts');

  const handleHostChange = (event) => {
    const { options } = event.target;
    const selected = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedHosts(selected);
  };

  if (loading) return <p>Loading hosts...</p>;
  if (error) return <p>Error loading hosts: {error}</p>;

  return (
    <div>
      <label htmlFor="host-selector">Select Hosts:</label>
      <select
        id="host-selector"
        multiple
        value={selectedHosts}
        onChange={handleHostChange}
        className="form-control"
        style={{ height: '200px' }}
      >
        {hosts && hosts.map((host) => (
          <option key={host} value={host}>
            {host}
          </option>
        ))}
      </select>
    </div>
  );
};

export default HostSelector;
