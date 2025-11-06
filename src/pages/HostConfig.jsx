import React, { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useApiCache } from '../contexts/ApiCacheContext';
import Loader from '../components/Loader';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import '../styles/hostConfig.css';

const HostConfig = () => {
  const [newHostName, setNewHostName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [editingHostId, setEditingHostId] = useState(null);
  const [editHostName, setEditHostName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null);

  const { clearCache } = useApiCache();
  
  // 1. CORRETTO: Aggiunto lo slash '/' all'inizio dell'endpoint
  const { data: hostsData, loading: hostsLoading, error: hostsError, refresh: refreshHosts } = useApi('/hosts', {}, 'hosts');
  
  // 2. CORRETTO: Aggiunto lo slash '/'
  const { loading: addLoading, error: addError, postData } = useApi('/hosts', { manual: true });
  
  // 3. CORRETTO: Aggiunto lo slash '/' (gestito automaticamente da useApi)
  const { loading: deleteLoading, error: deleteError, deleteData } = useApi(
    selectedHost ? `/hosts/${selectedHost.host_id}` : null, 
    { manual: true }
  );
  
  // (In futuro, per l'update (PUT), avrai bisogno di un'altra istanza di useApi)
  // const { loading: updateLoading, error: updateError, putData } = useApi(...)
  
  const hostsList = useMemo(() => hostsData?.hosts || [], [hostsData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newHostName || !newClientName) return;

    await postData({
      host_name: newHostName,
      client_name: newClientName,
    });
    
    setNewHostName('');
    setNewClientName('');
    clearCache('hosts');
    refreshHosts();
  };

  const handleDeleteClick = (host) => {
    setSelectedHost(host);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedHost) return;
    
    await deleteData();
    setShowDeleteModal(false);
    setSelectedHost(null);
    clearCache('hosts');
    refreshHosts();
  };

  const handleEditClick = (host) => {
    setEditingHostId(host.host_id);
    setEditHostName(host.host_name);
    setEditClientName(host.client_name);
  };

  const handleCancelEdit = () => {
    setEditingHostId(null);
  };
  
  const handleSaveEdit = async (hostId) => {
    // Qui andrebbe la logica per salvare (chiamata PUT)
    console.log("Salvataggio (non implementato):", hostId, editHostName, editClientName);
    // await putData({ host_name: editHostName, client_name: editClientName });
    setEditingHostId(null);
    // clearCache('hosts');
    // refreshHosts();
  };


  if (hostsLoading && !hostsData) {
    return <Loader message="Caricamento configurazione host..." />;
  }

  return (
    <div className="host-config-page">
      <h2>Configurazione Host</h2>
      
      {/* 4. CORRETTO: Aggiunto .message per visualizzare gli errori e non l'oggetto */}
      {hostsError && <div className="error-message">{hostsError.message}</div>}
      {addError && <div className="error-message">Errore aggiunta: {addError.message}</div>}
      {deleteError && <div className="error-message">Errore eliminazione: {deleteError.message}</div>}

      <div className="form-card add-host-form">
        <h3>Aggiungi Nuovo Host</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="new-host-name">Nome Host</label>
              <input
                id="new-host-name"
                type="text"
                value={newHostName}
                onChange={(e) => setNewHostName(e.target.value)}
                placeholder="es. server.example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-client-name">Nome Cliente</label>
              <input
                id="new-client-name"
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="es. Cliente XYZ"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={addLoading}>
            {addLoading ? 'Aggiunta...' : <><FaPlus /> Aggiungi Host</>}
          </button>
        </form>
      </div>

      <div className="table-container">
        <h3>Host Esistenti</h3>
        <table>
          <thead>
            <tr>
              <th>Nome Host</th>
              <th>Nome Cliente</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {hostsList.map((host) => (
              <tr key={host.host_id}>
                {editingHostId === host.host_id ? (
                  <>
                    <td>
                      <input 
                        type="text" 
                        value={editHostName} 
                        onChange={(e) => setEditHostName(e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={editClientName} 
                        onChange={(e) => setEditClientName(e.target.value)}
                      />
                    </td>
                    <td className="actions">
                      <button className="action-button save" onClick={() => handleSaveEdit(host.host_id)}>
                        <FaSave />
                      </button>
                      <button className="action-button cancel" onClick={handleCancelEdit}>
                        <FaTimes />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{host.host_name}</td>
                    <td>{host.client_name}</td>
                    <td className="actions">
                      <button className="action-button edit" onClick={() => handleEditClick(host)}>
                        <FaEdit />
                      </button>
                      <button className="action-button delete" onClick={() => handleDeleteClick(host)}>
                        <FaTrash />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Conferma Eliminazione</h3>
            <p>Sei sicuro di voler eliminare l'host <strong>{selectedHost?.host_name}</strong> (Cliente: {selectedHost?.client_name})?</p>
            <div className="modal-actions">
              <button 
                className="modal-button cancel" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Annulla
              </button>
              <button 
                className="modal-button delete" 
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostConfig;