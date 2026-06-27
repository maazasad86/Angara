import React, { useState, useEffect, useMemo } from 'react';
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
import { SkeletonTable } from '../components/Skeleton';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, 7days, 30days, custom
  const [customDateType, setCustomDateType] = useState('day'); // day, week, month, range
  const [customSingleDate, setCustomSingleDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [customWeekStart, setCustomWeekStart] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [customMonth, setCustomMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [customRangeStart, setCustomRangeStart] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [customRangeEnd, setCustomRangeEnd] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  
  // Tabs
  const [activeTab, setActiveTab] = useState('itemized'); // itemized, transactions

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab, 
    categoryFilter, 
    itemSearchQuery, 
    dateFilter, 
    customDateType, 
    customSingleDate, 
    customWeekStart, 
    customMonth, 
    customRangeStart, 
    customRangeEnd
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, catsRes] = await Promise.all([
        axios.get(`http://${(window.location.hostname || 'localhost')}:5000/api/sales`),
        axios.get(`http://${(window.location.hostname || 'localhost')}:5000/api/categories`)
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
  const salesByDate = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const saleDateTime = saleDate.getTime();
      
      if (dateFilter === 'today') {
        return saleDateTime >= todayStart;
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
        return saleDateTime >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
        return saleDateTime >= thirtyDaysAgo;
      } else if (dateFilter === 'custom') {
        if (customDateType === 'day' && customSingleDate) {
          const y = saleDate.getFullYear();
          const m = String(saleDate.getMonth() + 1).padStart(2, '0');
          const d = String(saleDate.getDate()).padStart(2, '0');
          const localSaleDateStr = `${y}-${m}-${d}`;
          return localSaleDateStr === customSingleDate;
        } else if (customDateType === 'week' && customWeekStart) {
          const start = new Date(customWeekStart);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          return saleDateTime >= start.getTime() && saleDateTime <= end.getTime();
        } else if (customDateType === 'month' && customMonth) {
          const y = saleDate.getFullYear();
          const m = String(saleDate.getMonth() + 1).padStart(2, '0');
          const localSaleMonthStr = `${y}-${m}`;
          return localSaleMonthStr === customMonth;
        } else if (customDateType === 'range') {
          let startValid = true;
          let endValid = true;
          
          if (customRangeStart) {
            const start = new Date(customRangeStart);
            start.setHours(0, 0, 0, 0);
            startValid = saleDateTime >= start.getTime();
          }
          if (customRangeEnd) {
            const end = new Date(customRangeEnd);
            end.setHours(23, 59, 59, 999);
            endValid = saleDateTime <= end.getTime();
          }
          return startValid && endValid;
        }
      }
      return true; // all
    });
  }, [sales, dateFilter, customDateType, customSingleDate, customWeekStart, customMonth, customRangeStart, customRangeEnd]);

  // 2. Aggregate Itemized Sales from Sales list
  const allItemizedSales = useMemo(() => {
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
  }, [salesByDate]);

  // 3. Filter Itemized Sales
  const filteredItemizedSales = useMemo(() => {
    return allItemizedSales.filter(item => {
      const matchesCategory = categoryFilter === 'All' || item.categoryName === categoryFilter;
      const matchesSearch = item.name.toLowerCase().includes(itemSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allItemizedSales, categoryFilter, itemSearchQuery]);

  // 4. Filter Transactions (Orders)
  const filteredTransactions = useMemo(() => {
    return salesByDate.filter(sale => {
      // If category filter is applied, check if at least one item in sale matches the category
      const matchesCategory = categoryFilter === 'All' || 
        sale.items.some(item => item.categoryName === categoryFilter);

      // If search filter is applied, check if at least one item matches search query
      const matchesSearch = itemSearchQuery === '' || 
        sale.items.some(item => item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [salesByDate, categoryFilter, itemSearchQuery]);

  // 5. Calculate Metrics based on filtered date range
  const { totalRevenue, totalOrders, totalItemsSold, averageOrderValue } = useMemo(() => {
    const revenue = salesByDate.reduce((sum, s) => sum + s.totalAmount, 0);
    const orders = salesByDate.length;
    const itemsSold = salesByDate.reduce((sum, s) => 
      sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const avgOrderValue = orders > 0 ? (revenue / orders) : 0;
    
    return {
      totalRevenue: revenue,
      totalOrders: orders,
      totalItemsSold: itemsSold,
      averageOrderValue: avgOrderValue
    };
  }, [salesByDate]);

  // Helper for dynamic font size
  const getDynamicFontSize = (valueStr) => {
    const len = valueStr.length;
    if (len > 12) return '1rem';
    if (len > 9) return '1.15rem';
    if (len > 7) return '1.25rem';
    return '1.4rem';
  };

  // Pagination logic
  const paginatedItemizedSales = useMemo(() => {
    return filteredItemizedSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredItemizedSales, currentPage]);
  const totalItemizedPages = Math.ceil(filteredItemizedSales.length / itemsPerPage);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredTransactions, currentPage]);
  const totalTransactionPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <Layout>
      <div style={styles.container}>
        {/* Compact Actions & Filters */}
        <div style={styles.filterSection} className="glass-card">
          <div style={styles.filtersRow}>
            {/* Search Item */}
            <div style={styles.inputIconContainer}>
              <Search size={16} style={styles.inputIcon} />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                style={styles.compactInput}
              />
            </div>

            {/* Date Range Selector Presets */}
            <div style={styles.datePills}>
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: '7days', label: '7 Days' },
                { value: '30days', label: '30 Days' },
                { value: 'custom', label: 'Custom' },
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

            <button onClick={fetchData} style={styles.refreshBtn}>
              <RefreshCw size={16} />
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div style={styles.customFilterRow}>
              {/* Custom Type Selector */}
              <div style={styles.customTypePills}>
                {[
                  { value: 'day', label: 'Single Day' },
                  { value: 'week', label: 'Specific Week' },
                  { value: 'month', label: 'Specific Month' },
                  { value: 'range', label: 'Custom Range' }
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setCustomDateType(type.value)}
                    style={{
                      ...styles.customTypePill,
                      backgroundColor: customDateType === type.value ? 'var(--primary-yellow)' : 'rgba(255, 255, 255, 0.03)',
                      color: customDateType === type.value ? '#000000' : 'var(--text-muted)',
                      borderColor: customDateType === type.value ? 'var(--primary-yellow)' : 'var(--glass-border)'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Input Selectors */}
              <div style={styles.customInputsContainer}>
                {customDateType === 'day' && (
                  <div style={styles.inputWithLabel}>
                    <span style={styles.inputLabel}>Select Day:</span>
                    <input 
                      type="date" 
                      value={customSingleDate} 
                      onChange={(e) => setCustomSingleDate(e.target.value)} 
                      style={styles.datePickerInput}
                    />
                  </div>
                )}
                {customDateType === 'week' && (
                  <div style={styles.inputWithLabel}>
                    <span style={styles.inputLabel}>Week Starting:</span>
                    <input 
                      type="date" 
                      value={customWeekStart} 
                      onChange={(e) => setCustomWeekStart(e.target.value)} 
                      style={styles.datePickerInput}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>(Fetches 7 days)</span>
                  </div>
                )}
                {customDateType === 'month' && (
                  <div style={styles.inputWithLabel}>
                    <span style={styles.inputLabel}>Select Month:</span>
                    <input 
                      type="month" 
                      value={customMonth} 
                      onChange={(e) => setCustomMonth(e.target.value)} 
                      style={styles.datePickerInput}
                    />
                  </div>
                )}
                {customDateType === 'range' && (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={styles.inputWithLabel}>
                      <span style={styles.inputLabel}>From:</span>
                      <input 
                        type="date" 
                        value={customRangeStart} 
                        onChange={(e) => setCustomRangeStart(e.target.value)} 
                        style={styles.datePickerInput}
                      />
                    </div>
                    <div style={styles.inputWithLabel}>
                      <span style={styles.inputLabel}>To:</span>
                      <input 
                        type="date" 
                        value={customRangeEnd} 
                        onChange={(e) => setCustomRangeEnd(e.target.value)} 
                        style={styles.datePickerInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metrics Row */}
        <div style={styles.metricsGrid}>
          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(250, 204, 21, 0.1)', color: 'var(--primary-yellow)' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <p style={styles.metricTitle}>Total Revenue</p>
              <h2 style={{ ...styles.metricValue, fontSize: getDynamicFontSize(`Rs. ${totalRevenue.toLocaleString()}`) }}>
                Rs. {totalRevenue.toLocaleString()}
              </h2>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <p style={styles.metricTitle}>Total Orders</p>
              <h2 style={{ ...styles.metricValue, fontSize: getDynamicFontSize(`${totalOrders}`) }}>
                {totalOrders}
              </h2>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
              <Package size={20} />
            </div>
            <div>
              <p style={styles.metricTitle}>Items Sold</p>
              <h2 style={{ ...styles.metricValue, fontSize: getDynamicFontSize(`${totalItemsSold}`) }}>
                {totalItemsSold}
              </h2>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <p style={styles.metricTitle}>Avg. Order Value</p>
              <h2 style={{ ...styles.metricValue, fontSize: getDynamicFontSize(`Rs. ${Math.round(averageOrderValue).toLocaleString()}`) }}>
                Rs. {Math.round(averageOrderValue).toLocaleString()}
              </h2>
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
              <div style={{ padding: '2rem' }}>
                <SkeletonTable rows={5} columns={6} />
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
                      {paginatedItemizedSales.map((item, idx) => (
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
                  
                  {totalItemizedPages > 1 && (
                    <div style={styles.pagination}>
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}>Previous</button>
                      <span style={styles.pageInfo}>Page {currentPage} of {totalItemizedPages}</span>
                      <button disabled={currentPage === totalItemizedPages} onClick={() => setCurrentPage(p => p + 1)} style={{ ...styles.pageBtn, opacity: currentPage === totalItemizedPages ? 0.5 : 1 }}>Next</button>
                    </div>
                  )}
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
                        <th style={styles.th}>Type & Customer</th>
                        <th style={styles.th}>Order Items</th>
                        <th style={styles.th}>Total Items</th>
                        <th style={styles.th}>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((sale, idx) => {
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
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: sale.orderType === 'Dine-in' ? 'rgba(74, 222, 128, 0.1)' : 
                                                sale.orderType === 'Delivery' ? 'rgba(96, 165, 250, 0.1)' : 
                                                'rgba(250, 204, 21, 0.1)',
                                color: sale.orderType === 'Dine-in' ? '#4ade80' : 
                                      sale.orderType === 'Delivery' ? '#60a5fa' : 
                                      'var(--primary-yellow)',
                                display: 'inline-block'
                              }}>
                                {sale.orderType || 'Takeaway'}
                              </span>
                              {sale.orderType === 'Delivery' && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                  {sale.customerName && <div>{sale.customerName}</div>}
                                  {sale.customerPhone && <div>{sale.customerPhone}</div>}
                                </div>
                              )}
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
                  
                  {totalTransactionPages > 1 && (
                    <div style={styles.pagination}>
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}>Previous</button>
                      <span style={styles.pageInfo}>Page {currentPage} of {totalTransactionPages}</span>
                      <button disabled={currentPage === totalTransactionPages} onClick={() => setCurrentPage(p => p + 1)} style={{ ...styles.pageBtn, opacity: currentPage === totalTransactionPages ? 0.5 : 1 }}>Next</button>
                    </div>
                  )}
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
    gap: '1rem',
  },
  filterSection: {
    padding: '0.75rem 1rem',
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  inputIconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '200px',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.75rem',
    color: 'var(--text-muted)',
  },
  compactInput: {
    width: '100%',
    padding: '0.5rem 1rem 0.5rem 2.25rem',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
  },
  datePills: {
    display: 'flex',
    gap: '0.4rem',
  },
  datePill: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  metricCard: {
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  iconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '0.1rem',
  },
  metricValue: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-main)',
    whiteSpace: 'nowrap',
    transition: 'font-size 0.3s ease',
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
    padding: '1rem 1.5rem',
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
    padding: '0.75rem 1rem',
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
    padding: '0.75rem 1rem',
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
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--glass-border)'
  },
  pageBtn: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass)',
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  pageInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '600'
  },
  customFilterRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px dashed var(--glass-border)',
  },
  customTypePills: {
    display: 'flex',
    gap: '0.4rem',
  },
  customTypePill: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  customInputsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  inputWithLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  inputLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  datePickerInput: {
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    outline: 'none',
    width: 'auto',
  }
};

export default Sales;
