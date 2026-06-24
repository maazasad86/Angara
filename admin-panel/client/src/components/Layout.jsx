import React from 'react';
import Sidebar from './Sidebar';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard Overview</h1>
            <p style={styles.pageSubtitle}>Welcome back, Admin!</p>
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
    backgroundColor: 'var(--bg-black)',
  },
  main: {
    flex: 1,
    marginLeft: '280px',
    padding: '2rem 3rem',
    backgroundColor: 'var(--bg-main)',
    transition: 'background-color 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem',
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  pageSubtitle: {
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  content: {
    animation: 'fadeIn 0.5s ease-out',
  }
};

export default Layout;
