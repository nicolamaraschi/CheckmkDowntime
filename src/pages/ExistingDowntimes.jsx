import React, { useState, useMemo, useEffect } from 'react';
import { FaTrash, FaSync, FaSearch } from 'react-icons/fa';
// 1. CORRETTO: Importa i nuovi hook da @tanstack/react-table
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender 
} from '@tanstack/react-table';
import Loader from '../components/Loader';
import { useApi } from '../hooks/useApi';
import { useApiCache } from '../contexts/ApiCacheContext';
import '../styles/existingDowntimes.css';


const ExistingDowntimes = () => {
  const [downtimes, setDowntimes] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('Caricamento downtimes...');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDowntime, setSelectedDowntime] = useState(null);
  
  // Stati per TanStack Table v8
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const { clearCache } = useApiCache();

  // 'hostsData' è il nome corretto
  const { data: hostsData } = useApi('/hosts', { manual: true }, 'hosts');

  const { 
    data: downtimesData, 
    loading: downtimesLoading, 
    error: downtimesError, 
    refresh: refreshDowntimes 
  } = useApi('/downtimes'); 

  // Chiamata API per eliminare il downtime (manuale)
  const { loading: deleteLoading, error: deleteError, deleteData } = useApi(
    selectedDowntime ? `/downtimes/${selectedDowntime.downtime_id}` : null, 
    { manual: true }
  );

  // Carica i dati degli host manualmente quando il componente si monta
  const { refresh: refreshHosts } = useApi('/hosts', { manual: true }, 'hosts');
  useEffect(() => {
    refreshHosts();
  }, [refreshHosts]);

  const hostsMap = useMemo(() => {
    if (!hostsData || !hostsData.hosts) {
      return {};
    }
    return hostsData.hosts.reduce((acc, host) => {
      acc[host.host_name] = host.client_name;
      return acc;
    }, {});
  }, [hostsData]);

  useEffect(() => {
    if (downtimesData && hostsData) {
      const processedDowntimes = downtimesData.map(dt => ({
        ...dt,
        client_name: hostsMap[dt.host_name] || 'N/A', 
      }));
      setDowntimes(processedDowntimes);
      setLoadingMessage('');
    } else if (downtimesLoading) {
      setLoadingMessage('Caricamento downtimes...');
    } else if (downtimesError) {
      setLoadingMessage(`Errore: ${downtimesError.message}`);
    }
  }, [downtimesData, downtimesLoading, downtimesError, hostsData, hostsMap]);

  const handleRefresh = () => {
    setLoadingMessage('Aggiornamento dati...');
    clearCache('/downtimes');
    clearCache('/hosts');
    refreshDowntimes();
    refreshHosts();
  };

  const handleDeleteClick = (downtime) => {
    setSelectedDowntime(downtime);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedDowntime) return;
    try {
      await deleteData();
      setShowDeleteModal(false);
      setSelectedDowntime(null);
      handleRefresh();
    } catch (e) { /* errore gestito da useApi */ }
  };

  // 2. CORRETTO: Definizione delle colonne per v8
  const columns = useMemo(() => [
    { header: 'Cliente', accessorKey: 'client_name' },
    { header: 'Host', accessorKey: 'host_name' },
    { header: 'Autore', accessorKey: 'author' },
    { header: 'Commento', accessorKey: 'comment' },
    { header: 'Inizio', accessorKey: 'start_time' },
    { header: 'Fine', accessorKey: 'end_time' },
    { header: 'Tipo', accessorKey: 'downtime_type' },
    { header: 'ID', accessorKey: 'downtime_id' },
    {
      header: 'Azioni',
      id: 'actions',
      // 'cell' usa flexRender e ottiene info da 'row'
      cell: ({ row }) => (
        <button 
          className="action-button delete"
          onClick={() => handleDeleteClick(row.original)}
        >
          <FaTrash />
        </button>
      )
    }
  ], []); // Dipendenza vuota, le funzioni sono stabili

  // 3. CORRETTO: Setup della tabella v8
  const table = useReactTable({
    data: downtimes,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loadingMessage) {
    return <Loader message={loadingMessage} />;
  }

  return (
    <div className="existing-downtimes-page">
      <div className="toolbar">
        <h2>Downtime Esistenti</h2>
        <div className="toolbar-actions">
          <div className="search-bar">
            <FaSearch />
            <input
              value={globalFilter || ''}
              onChange={e => setGlobalFilter(e.target.value || undefined)}
              placeholder="Cerca in tutti i campi..."
            />
          </div>
          <button className="action-button refresh" onClick={handleRefresh}>
            <FaSync />
            <span>Aggiorna</span>
          </button>
        </div>
      </div>

      {(deleteError) && (
        <div className="message-banner error">
          Errore during l'eliminazione: {deleteError.message}
        </div>
      )}
      
      {/* 4. CORRETTO: Render della tabella v8 */}
      <div className="table-container">
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <span>
                      {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? ''}
                    </span>
                    {/* Filtri per colonna rimossi per semplicità, 
                        dato che il global filter è attivo */}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. CORRETTO: Controlli paginazione v8 */}
      <div className="pagination-controls">
        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
          {'<<'}
        </button>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {'<'}
        </button>
        <span>
          Pagina{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} di {table.getPageCount()}
          </strong>{' '}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {'>'}
        </button>
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
          {'>>'}
        </button>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>
              Mostra {size}
            </option>
          ))}
        </select>
      </div>

      {/* Il modale non cambia */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Conferma Eliminazione</h3>
            <p>Sei sicuro di voler eliminare questo downtime?</p>
            <ul>
              <li><strong>ID:</strong> {selectedDowntime?.downtime_id}</li>
              <li><strong>Host:</strong> {selectedDowntime?.host_name}</li>
              <li><strong>Cliente:</strong> {selectedDowntime?.client_name}</li>
            </ul>
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

export default ExistingDowntimes;