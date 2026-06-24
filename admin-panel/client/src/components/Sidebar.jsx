import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  ChevronRight,
  Grid,
  Package,
  ShoppingCart,
  Tag
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'POS', path: '/pos', icon: <ShoppingCart size={20} /> },
    { name: 'Deals', path: '/deals', icon: <Tag size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Grid size={20} /> },
    { name: 'Items', path: '/items', icon: <Package size={20} /> },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>A</div>
        <h2 style={styles.logoText}>ANGARA</h2>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              backgroundColor: isActive ? 'var(--primary-yellow)' : 'transparent',
              color: isActive ? '#000000' : 'var(--text-muted)',
            })}
          >
            <div style={styles.navContent}>
              {item.icon}
              <span style={styles.navLabel}>{item.name}</span>
            </div>
            <ChevronRight size={16} />
          </NavLink>
        ))}
      </nav>

      <div style={styles.footerActions}>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '280px',
    height: '100vh',
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 1.5rem',
    position: 'fixed',
    left: 0,
    top: 0,
    transition: 'all 0.3s ease',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '3rem',
    padding: '0 0.5rem',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--primary-yellow)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'black',
    fontWeight: '800',
    fontSize: '1.25rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '2px',
    color: 'var(--text-main)',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
  },
  navContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  navLabel: {
    fontWeight: '500',
  },
  footerActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '2rem',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--accent-red)',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
};

export default Sidebar;
