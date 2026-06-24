import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Tag, 
  ArrowLeft, 
  Save,
  Edit2
} from 'lucide-react';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter state for item selection
  const [activeCategory, setActiveCategory] = useState('All');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Deal state
  const [dealName, setDealName] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dealsRes, itemsRes, catsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/deals'),
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/categories')
      ]);
      setDeals(dealsRes.data);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setDealName('');
    setDealPrice('');
    setSelectedItems([]);
    setEditingId(null);
    setIsCreating(true);
  };

  const handleEdit = (deal) => {
    setDealName(deal.name);
    setDealPrice(deal.price);
    setSelectedItems(deal.items.map(i => ({
      ...i.item,
      quantity: i.quantity
    })));
    setEditingId(deal._id);
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await axios.delete(`http://localhost:5000/api/deals/${id}`);
        setDeals(deals.filter(d => d._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const addToDeal = (item) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromDeal = (id) => {
    setSelectedItems(prev => prev.filter(i => i._id !== id));
  };

  const updateItemQty = (id, delta) => {
    setSelectedItems(prev => prev.map(i => {
      if (i._id === id) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }));
  };

  const handleSaveDeal = async () => {
    if (!dealName || !dealPrice || selectedItems.length === 0) {
      alert('Please fill all fields and add at least one item');
      return;
    }

    const dealData = {
      name: dealName,
      price: parseFloat(dealPrice),
      items: selectedItems.map(i => ({
        item: i._id,
        quantity: i.quantity
      }))
    };

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/deals/${editingId}`, dealData);
        setDeals(deals.map(d => d._id === editingId ? res.data : d));
      } else {
        const res = await axios.post('http://localhost:5000/api/deals', dealData);
        setDeals([...deals, res.data]);
      }
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save deal');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category?.name === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(itemSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <Tag size={28} style={{ color: 'var(--primary-yellow)' }} />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Deals Management</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create and manage combo offers</p>
          </div>
        </div>
        {!isCreating && (
          <button onClick={handleCreateNew} className="btn-primary" style={styles.createBtn}>
            <Plus size={20} /> Create New Deal
          </button>
        )}
      </div>

      {!isCreating ? (
        <div style={styles.dealsGrid}>
          {deals.length > 0 ? (
            deals.map(deal => (
              <div key={deal._id} className="glass-card" style={styles.dealCard}>
                <div style={styles.dealCardContent}>
                  <div style={styles.dealInfo}>
                    <h3 style={styles.dealTitle}>{deal.name}</h3>
                    <div style={styles.dealPrice}>Rs. {deal.price}</div>
                  </div>
                  
                  <div style={styles.dealItemsPreview}>
                    {deal.items.map((di, idx) => (
                      <div key={idx} style={styles.dealItemRow}>
                        <span style={{ color: 'var(--primary-yellow)', fontWeight: '700' }}>{di.quantity}x</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{di.item?.name || 'Deleted Item'}</span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.cardActions}>
                    <button onClick={() => handleEdit(deal)} style={styles.iconBtn} className="hover-scale">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(deal._id)} style={{ ...styles.iconBtn, color: 'var(--accent-red)' }} className="hover-scale">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <Tag size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <h3>No Deals Created Yet</h3>
              <p>Click the button above to create your first combo deal</p>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.creatorContainer}>
          {/* Item Selector Side */}
          <div style={styles.itemsSide}>
            <div style={styles.selectorHeader}>
              <button onClick={() => setIsCreating(false)} style={styles.backBtn}>
                <ArrowLeft size={20} /> Back to List
              </button>
              
              <div style={styles.searchBox}>
                <Search size={18} style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Find items..." 
                  style={styles.searchInput}
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                />
              </div>

              <div style={styles.categoryTabs}>
                <button 
                  onClick={() => setActiveCategory('All')}
                  style={{
                    ...styles.tab,
                    backgroundColor: activeCategory === 'All' ? 'var(--primary-yellow)' : 'var(--glass)',
                    color: activeCategory === 'All' ? '#000' : 'var(--text-main)',
                  }}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat._id}
                    onClick={() => setActiveCategory(cat.name)}
                    style={{
                      ...styles.tab,
                      backgroundColor: activeCategory === cat.name ? 'var(--primary-yellow)' : 'var(--glass)',
                      color: activeCategory === cat.name ? '#000' : 'var(--text-main)',
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.itemsGridSmall}>
              {filteredItems.map(item => (
                <div 
                  key={item._id} 
                  className="glass-card" 
                  style={styles.smallItemCard}
                  onClick={() => addToDeal(item)}
                >
                  <img src={item.image} alt={item.name} style={styles.smallItemImage} />
                  <div style={styles.smallItemInfo}>
                    <p style={styles.smallItemName}>{item.name}</p>
                    <p style={styles.smallItemPrice}>Rs. {item.price}</p>
                  </div>
                  <div style={styles.addIconMini}><Plus size={14} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Config Side */}
          <div className="glass-card" style={styles.configSide}>
            <div style={styles.configHeader}>
              <h3>{editingId ? 'Edit Deal' : 'New Deal Setup'}</h3>
              <Tag size={20} style={{ opacity: 0.5 }} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Deal Name / Number</label>
              <input 
                type="text" 
                placeholder="e.g. Super Saver Deal 1" 
                style={styles.majorInput}
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Deal Price (Rs.)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                style={styles.majorInput}
                value={dealPrice}
                onChange={(e) => setDealPrice(e.target.value)}
              />
            </div>

            <div style={styles.selectedItemsList}>
              <label style={styles.label}>Selected Items ({selectedItems.length})</label>
              <div style={styles.itemsScroll}>
                {selectedItems.length > 0 ? (
                  selectedItems.map(item => (
                    <div key={item._id} style={styles.selectedItem}>
                      <div style={styles.selInfo}>
                        <p style={styles.selName}>{item.name}</p>
                        <p style={styles.selMeta}>Rs. {item.price}</p>
                      </div>
                      <div style={styles.qtyRow}>
                        <button onClick={() => updateItemQty(item._id, -1)} style={styles.miniQtyBtn}><Minus size={12} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateItemQty(item._id, 1)} style={styles.miniQtyBtn}><Plus size={12} /></button>
                        <button onClick={() => removeFromDeal(item._id)} style={styles.selRemove}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyPrompt}>
                    <Package size={32} style={{ opacity: 0.1, marginBottom: '0.5rem' }} />
                    <p>Select items from the left to build the deal</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSaveDeal} 
              className="btn-primary" 
              style={styles.saveBtn}
              disabled={!dealName || !dealPrice || selectedItems.length === 0}
            >
              <Save size={20} /> {editingId ? 'Update Deal' : 'Save Deal'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  createBtn: {
    padding: '0.75rem 1.5rem',
    gap: '0.5rem',
  },
  dealsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  dealCard: {
    padding: '1.5rem',
    height: 'fit-content',
    background: 'var(--bg-card)',
  },
  dealCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  dealInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dealTitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--text-main)',
  },
  dealPrice: {
    padding: '0.4rem 0.8rem',
    backgroundColor: 'var(--primary-yellow)',
    color: '#000',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.9rem',
  },
  dealItemsPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
  },
  dealItemRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    borderTop: '1px solid var(--glass-border)',
    paddingTop: '1rem',
  },
  iconBtn: {
    padding: '0.5rem',
    color: 'var(--text-muted)',
  },
  
  creatorContainer: {
    display: 'flex',
    gap: '2rem',
    height: 'calc(100vh - 200px)',
  },
  itemsSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  selectorHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    width: 'fit-content',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    borderRadius: '10px',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
  },
  categoryTabs: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  tab: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  itemsGridSmall: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '1rem',
    paddingRight: '0.5rem',
  },
  smallItemCard: {
    padding: '0.6rem',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  smallItemImage: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  smallItemInfo: {
    padding: '0 0.2rem',
  },
  smallItemName: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  smallItemPrice: {
    fontSize: '0.7rem',
    color: 'var(--primary-yellow)',
    fontWeight: '600',
  },
  addIconMini: {
    position: 'absolute',
    bottom: '0.6rem',
    right: '0.6rem',
    width: '20px',
    height: '20px',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    color: 'var(--primary-yellow)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  configSide: {
    width: '380px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    background: 'var(--bg-card)',
  },
  configHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '0.75rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  majorInput: {
    width: '100%',
    padding: '0.8rem 1rem',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    color: 'var(--text-main)',
    fontSize: '1rem',
    fontWeight: '600',
  },
  selectedItemsList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflow: 'hidden',
  },
  itemsScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    paddingRight: '0.4rem',
  },
  selectedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
  },
  selInfo: {
    flex: 1,
  },
  selName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  selMeta: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  miniQtyBtn: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    backgroundColor: 'var(--glass)',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selRemove: {
    color: 'var(--accent-red)',
    opacity: 0.6,
    marginLeft: '0.2rem',
  },
  saveBtn: {
    width: '100%',
    padding: '1rem',
    gap: '0.75rem',
    fontSize: '1rem',
  },
  emptyPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: 'var(--text-muted)',
    opacity: 0.5,
    fontSize: '0.85rem',
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  }
};

export default Deals;
