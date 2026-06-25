import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Map paths to friendly names
  const pageTitles = {
    '/dashboard': 'Dashboard Overview',
    '/pos': 'Point of Sale',
    '/sales': 'Sales Record',
    '/deals': 'Deals Management',
    '/categories': 'Categories',
    '/items': 'Items Inventory'
  };

  const title = pageTitles[location.pathname] || 'Admin Panel';

  return (
    <div style={styles.container}>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="layout-main" style={styles.main}>
        <header className="responsive-header" style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-header-btn" 
              onClick={() => setIsSidebarOpen(true)}
              style={styles.menuBtn}
            >
              <Menu size={24} />
            </button>
            <div className="page-header">
              <h1 style={styles.pageTitle}>{title}</h1>
              <p style={styles.pageSubtitle}>Management Console</p>
            </div>
          </div>
          
          <button onClick={toggleTheme} className="header-toggle">
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>

        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)',
  },
  main: {
    flex: 1,
    marginLeft: '280px',
    padding: '2rem 3rem',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem',
  },
  menuBtn: {
    display: 'none', // Shown via media query
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    padding: '0.6rem',
    borderRadius: '10px',
    color: 'var(--text-main)',
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-main)',
    lineHeight: 1.2,
  },
  pageSubtitle: {
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
    fontSize: '0.9rem',
  },
  content: {
    animation: 'fadeIn 0.5s ease-out',
  }
};

export default Layout;
