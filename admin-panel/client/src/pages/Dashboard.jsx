import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Package, Tags, Gift, Activity } from 'lucide-react';

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    items: 0,
    categories: 0,
    deals: 0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [itemsRes, catsRes, dealsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/categories'),
        axios.get('http://localhost:5000/api/deals')
      ]);

      const items = itemsRes.data || [];
      const categories = catsRes.data || [];
      const deals = dealsRes.data || [];

      setStatsData({
        items: items.length,
        categories: categories.length,
        deals: deals.length,
      });

      // Sort items by createdAt descending and take top 5
      const sortedItems = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      setRecentItems(sortedItems);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Total Items', value: statsData.items, icon: <Package />, color: 'var(--primary-yellow)' },
    { title: 'Total Categories', value: statsData.categories, icon: <Tags />, color: '#60a5fa' },
    { title: 'Total Deals', value: statsData.deals, icon: <Gift />, color: 'var(--accent-red)' },
  ];

  return (
    <Layout>
      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading dashboard data...</div>
      ) : (
        <>
          <div style={styles.grid}>
            {stats.map((stat, index) => (
              <div key={index} className="glass-card" style={styles.statCard}>
                <div style={{ ...styles.iconWrapper, backgroundColor: `${stat.color}20`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div style={styles.statInfo}>
                  <p style={styles.statTitle}>{stat.title}</p>
                  <h3 style={styles.statValue}>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.chartsRow}>
            <div className="glass-card" style={styles.mainCharCard}>
              <div style={styles.headerFlex}>
                <Activity color="var(--primary-yellow)" />
                <h3 style={styles.cardTitle}>Recently Added Items</h3>
              </div>
              
              <div style={styles.placeholderChart}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tr}>
                        <th style={styles.th}>IMAGE</th>
                        <th style={styles.th}>NAME</th>
                        <th style={styles.th}>CATEGORY</th>
                        <th style={styles.th}>PRICE</th>
                        <th style={styles.th}>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.length > 0 ? (
                        recentItems.map((item) => (
                          <tr key={item._id} style={styles.tr}>
                            <td style={styles.td}>
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                              />
                            </td>
                            <td style={styles.td}>{item.name}</td>
                            <td style={styles.td}>
                              <span style={styles.statusBadge}>{item.category?.name || 'N/A'}</span>
                            </td>
                            <td style={styles.td}>Rs. {item.price}</td>
                            <td style={styles.td}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr style={styles.tr}>
                          <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No recent items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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
  chartsRow: {
    marginTop: '2rem',
  },
  mainCharCard: {
    padding: '2rem',
  },
  headerFlex: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-main)',
    margin: 0,
  },
  placeholderChart: {
    width: '100%',
    minHeight: '200px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '600px',
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
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: 'var(--text-main)',
    verticalAlign: 'middle',
  },
  statusBadge: {
    padding: '0.35rem 0.85rem',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    borderRadius: '50px',
    fontSize: '0.75rem',
    fontWeight: '600',
  }
};

export default Dashboard;
