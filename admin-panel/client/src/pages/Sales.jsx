import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Search, 
  Filter, 
  TrendingUp, 
  RefreshCw, 
  Calendar,
  Grid
} from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, 7days, 30days
  
  // Tabs
  const [activeTab, setActiveTab] = useState('itemized'); // itemized, transactions

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, catsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sales'),
        axios.get('http://localhost:5000/api/categories')
      ]);
      setSales(salesRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error('Error fetching sales page data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Date Filter Logic
  const getFilteredSalesByDate = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt).getTime();
      if (dateFilter === 'today') {
        return saleDate >= todayStart;
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
        return saleDate >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
        return saleDate >= thirtyDaysAgo;
      }
      return true; // all
    });
  };

  const salesByDate = getFilteredSalesByDate();

  // 2. Aggregate Itemized Sales from Sales list
  const getItemizedSales = () => {
    const itemsMap = {};
    
    salesByDate.forEach(sale => {
      sale.items.forEach(item => {
        const key = `${item.name}-${item.type}-${item.price}`;
        if (!itemsMap[key]) {
          itemsMap[key] = {
            id: item.itemId || key,
            name: item.name,
            type: item.type,
            categoryName: item.categoryName || 'Uncategorized',
            price: item.price,
            quantitySold: 0,
            totalRevenue: 0
          };
        }
        itemsMap[key].quantitySold += item.quantity;
        itemsMap[key].totalRevenue += item.price * item.quantity;
      });
    });

    return Object.values(itemsMap);
  };

  const allItemizedSales = getItemizedSales();

  // 3. Filter Itemized Sales
  const filteredItemizedSales = allItemizedSales.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.categoryName === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(itemSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 4. Filter Transactions (Orders)
  const filteredTransactions = salesByDate.filter(sale => {
    // If category filter is applied, check if at least one item in sale matches the category
    const matchesCategory = categoryFilter === 'All' || 
      sale.items.some(item => item.categoryName === categoryFilter);

    // If search filter is applied, check if at least one item matches search query
    const matchesSearch = itemSearchQuery === '' || 
      sale.items.some(item => item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // 5. Calculate Metrics based on filtered date range
  const totalRevenue = salesByDate.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalOrders = salesByDate.length;
  const totalItemsSold = salesByDate.reduce((sum, s) => 
    sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  return (
    <Layout>
      <div style={styles.container}>
        {/* Top Actions & Filters */}
        <div style={styles.filterSection} className="glass-card">
          <div style={styles.filterHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} style={{ color: 'var(--primary-yellow)' }} />
              <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Filter Records</h3>
            </div>
            <button onClick={fetchData} style={styles.refreshBtn}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          
          <div style={styles.filtersGrid}>
            {/* Search Item */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Search Item Name</label>
              <div style={styles.inputIconContainer}>
                <Search size={18} style={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="e.g. Burger, Deal 1..." 
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  style={styles.inputField}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Category</label>
              <div style={styles.inputIconContainer}>
                <Grid size={18} style={styles.inputIcon} />
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={styles.selectField}
                >
                  <option value="All">All Categories</option>
                  <option value="Deals">Deals</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Selector Presets */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date Range</label>
              <div style={styles.datePills}>
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: '7days', label: '7 Days' },
                  { value: '30days', label: '30 Days' },
                ].map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setDateFilter(preset.value)}
                    style={{
                      ...styles.datePill,
                      backgroundColor: dateFilter === preset.value ? 'var(--primary-yellow)' : 'rgba(255, 255, 255, 0.03)',
                      color: dateFilter === preset.value ? '#000000' : 'var(--text-muted)',
                      borderColor: dateFilter === preset.value ? 'var(--primary-yellow)' : 'var(--glass-border)'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={styles.metricsGrid}>
          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(250, 204, 21, 0.1)', color: 'var(--primary-yellow)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <p style={styles.metricTitle}>Total Revenue</p>
              <h2 style={styles.metricValue}>Rs. {totalRevenue.toLocaleString()}</h2>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <p style={styles.metricTitle}>Total Orders</p>
              <h2 style={styles.metricValue}>{totalOrders}</h2>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
              <Package size={24} />
            </div>
            <div>
              <p style={styles.metricTitle}>Items Sold</p>
              <h2 style={styles.metricValue}>{totalItemsSold}</h2>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={styles.metricTitle}>Avg. Order Value</p>
              <h2 style={styles.metricValue}>Rs. {Math.round(averageOrderValue).toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="glass-card" style={styles.contentCard}>
          {/* Tab Selector */}
          <div style={styles.tabHeader}>
            <button 
              onClick={() => setActiveTab('itemized')}
              style={{
                ...styles.tabBtn,
                borderBottomColor: activeTab === 'itemized' ? 'var(--primary-yellow)' : 'transparent',
                color: activeTab === 'itemized' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              Itemized Sales
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              style={{
                ...styles.tabBtn,
                borderBottomColor: activeTab === 'transactions' ? 'var(--primary-yellow)' : 'transparent',
                color: activeTab === 'transactions' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              Order Transactions ({filteredTransactions.length})
            </button>
          </div>

          {/* Tab Content */}
          <div style={styles.tabBody}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <RefreshCw size={36} className="spin" style={{ color: 'var(--primary-yellow)', animation: 'spin 1.5s linear infinite' }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading sales data...</p>
              </div>
            ) : activeTab === 'itemized' ? (
              /* Itemized Sales View */
              filteredItemizedSales.length > 0 ? (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item / Deal Name</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Unit Price</th>
                        <th style={styles.th}>Qty Sold</th>
                        <th style={styles.th}>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItemizedSales.map((item, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: '700' }}>{item.name}</td>
                          <td style={styles.td}>
                            <span style={styles.categoryBadge}>{item.categoryName}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ 
                              ...styles.typeBadge, 
                              backgroundColor: item.type === 'deal' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                              color: item.type === 'deal' ? '#ef4444' : '#60a5fa'
                            }}>
                              {item.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>Rs. {item.price}</td>
                          <td style={{ ...styles.td, fontWeight: '700' }}>{item.quantitySold}</td>
                          <td style={{ ...styles.td, fontWeight: '800', color: 'var(--primary-yellow)' }}>
                            Rs. {item.totalRevenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Package size={48} style={{ opacity: 0.3, color: 'var(--text-muted)' }} />
                  <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>No items match your filters.</p>
                </div>
              )
            ) : (
              /* Transactions View */
              filteredTransactions.length > 0 ? (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date & Time</th>
                        <th style={styles.th}>Order Items</th>
                        <th style={styles.th}>Total Items</th>
                        <th style={styles.th}>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((sale, idx) => {
                        const date = new Date(sale.createdAt);
                        const formattedDate = date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                        const formattedTime = date.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={sale._id || idx} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={{ fontWeight: '700' }}>{formattedDate}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedTime}</div>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.transactionItemsContainer}>
                                {sale.items.map((item, idx) => (
                                  <div key={idx} style={styles.transactionItemPill}>
                                    <span style={{ color: 'var(--primary-yellow)', fontWeight: '700' }}>{item.quantity}x</span> {item.name}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>(Rs. {item.price})</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td style={styles.td}>
                              {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                            </td>
                            <td style={{ ...styles.td, fontWeight: '800', color: 'var(--primary-yellow)' }}>
                              Rs. {sale.totalAmount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <ShoppingBag size={48} style={{ opacity: 0.3, color: 'var(--text-muted)' }} />
                  <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>No orders match your filters.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  filterSection: {
    padding: '1.5rem',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '0.75rem',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    transition: 'all 0.3s ease',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  inputIconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
  },
  inputField: {
    paddingLeft: '2.75rem',
  },
  selectField: {
    paddingLeft: '2.75rem',
    cursor: 'pointer',
  },
  datePills: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  datePill: {
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  metricCard: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '0.2rem',
  },
  metricValue: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-main)',
  },
  contentCard: {
    padding: '0',
    overflow: 'hidden',
  },
  tabHeader: {
    display: 'flex',
    borderBottom: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  tabBtn: {
    padding: '1.25rem 2rem',
    fontSize: '0.95rem',
    fontWeight: '700',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  tabBody: {
    padding: '1.5rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 0',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '1rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
    borderBottom: '2px solid var(--glass-border)',
    fontSize: '0.9rem',
  },
  tr: {
    borderBottom: '1px solid var(--glass-border)',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    color: 'var(--primary-yellow)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  typeBadge: {
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  transactionItemsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  transactionItemPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    padding: '0.3rem 0.6rem',
    fontSize: '0.8rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 0',
  }
};

export default Sales;
