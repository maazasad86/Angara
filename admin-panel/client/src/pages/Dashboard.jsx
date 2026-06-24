import React from 'react';
import Layout from '../components/Layout';
import { TrendingUp, Users, DollarSign, Package } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: '$54,230', change: '+12.5%', icon: <DollarSign />, color: 'var(--primary-yellow)' },
    { title: 'Active Users', value: '1,240', change: '+5.2%', icon: <Users />, color: '#60a5fa' },
    { title: 'Total Orders', value: '452', change: '-2.4%', icon: <Package />, color: 'var(--accent-red)' },
    { title: 'Growth Rate', value: '18.4%', change: '+4.1%', icon: <TrendingUp />, color: '#4ade80' },
  ];

  return (
    <Layout>
      <div style={styles.grid}>
        {stats.map((stat, index) => (
          <div key={index} className="glass-card" style={styles.statCard}>
            <div style={{ ...styles.iconWrapper, backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div style={styles.statInfo}>
              <p style={styles.statTitle}>{stat.title}</p>
              <h3 style={styles.statValue}>{stat.value}</h3>
              <span style={{ 
                ...styles.statChange, 
                color: stat.change.startsWith('+') ? '#4ade80' : 'var(--accent-red)' 
              }}>
                {stat.change} <span style={{ color: 'var(--text-gray)', fontSize: '0.75rem' }}>vs last month</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chartsRow}>
        <div className="glass-card" style={styles.mainCharCard}>
          <h3 style={styles.cardTitle}>Recent Activity</h3>
          <div style={styles.placeholderChart}>
            {/* Table placeholder */}
            <table style={styles.table}>
              <thead>
                <tr style={styles.tr}>
                  <th style={styles.th}>USER</th>
                  <th style={styles.th}>ACTION</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>User {i}</td>
                    <td style={styles.td}>Updated Profile</td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge}>Success</span>
                    </td>
                    <td style={styles.td}>Oct {10 + i}, 2023</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statTitle: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  statChange: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginTop: '0.25rem',
  },
  chartsRow: {
    marginTop: '2rem',
  },
  mainCharCard: {
    padding: '2rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    marginBottom: '1.5rem',
    color: 'var(--text-main)',
  },
  placeholderChart: {
    width: '100%',
    minHeight: '200px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '1rem',
    borderBottom: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid var(--glass-border)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    color: '#4ade80',
    borderRadius: '50px',
    fontSize: '0.75rem',
    fontWeight: '600',
  }
};

export default Dashboard;
