import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaClock, 
  FaList, 
  FaHdd, 
  FaCog 
} from 'react-icons/fa';
// import { useAuth } from '../auth/AuthProvider'; // <-- RIMOSSO
import '../styles/sidebar.css';

const Sidebar = () => {
  // const { user } = useAuth(); // <-- RIMOSSO
  // const isAdmin = user?.signInUserSession?.idToken?.payload['cognito:groups']?.includes('admin'); // <-- RIMOSSO

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaClock />
              <span>Pianifica Downtime</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/existing" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaList />
              <span>Downtime Esistenti</span>
            </NavLink>
          </li>
          {/* Per ora, lasciamo questo link visibile a tutti.
              Per ripristinare la logica 'isAdmin', dovrai passare l'oggetto 'user'
              da App.js -> Layout.jsx -> Sidebar.jsx
          */}
          {/* {isAdmin && ( */}
            <li>
              <NavLink to="/hosts" className={({ isActive }) => isActive ? 'active' : ''}>
                <FaHdd />
                <span>Configurazione Host</span>
              </NavLink>
            </li>
          {/* )} */}
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaCog />
              <span>Impostazioni</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;