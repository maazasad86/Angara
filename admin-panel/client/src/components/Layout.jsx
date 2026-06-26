import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1100);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1100);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1100;
      setIsMobile(mobile);
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

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
      {isSidebarOpen && isMobile && <div className="overlay" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="layout-main" style={{ ...styles.main, marginLeft: isSidebarOpen && !isMobile ? '280px' : '0' }}>
        <header className="responsive-header sticky-header" style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="sidebar-toggle-btn" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
    padding: '1rem 2rem',
    transition: 'all 0.3s ease',
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuBtn: {
    display: 'flex',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    padding: '0.4rem',
    borderRadius: '10px',
    color: 'var(--text-main)',
  },
  pageTitle: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-main)',
    lineHeight: 1.1,
  },
  pageSubtitle: {
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
    fontSize: '0.8rem',
  },
  content: {
    animation: 'fadeIn 0.5s ease-out',
    width: '100%',
    minWidth: 0,
  }
};

export default Layout;
