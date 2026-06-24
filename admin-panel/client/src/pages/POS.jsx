import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, Package } from 'lucide-react';

const POS = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Cart/Bill State
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/categories')
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category?.name === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div style={styles.posContainer}>
        {/* Left Side: Items Selection */}
        <div style={styles.menuSide}>
          <div style={styles.menuHeader}>
            <div style={styles.searchContainer}>
              <Search size={20} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search items..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={styles.categoriesScroll}>
              <button 
                onClick={() => setActiveCategory('All')}
                style={{
                  ...styles.catTab,
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
                    ...styles.catTab,
                    backgroundColor: activeCategory === cat.name ? 'var(--primary-yellow)' : 'var(--glass)',
                    color: activeCategory === cat.name ? '#000' : 'var(--text-main)',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.itemsGrid}>
            {loading ? (
              <p>Loading items...</p>
            ) : filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div 
                  key={item._id} 
                  className="glass-card" 
                  style={styles.itemCard}
                  onClick={() => addToCart(item)}
                >
                  <div style={styles.itemImageContainer}>
                    <img src={item.image} alt={item.name} style={styles.itemImage} />
                    <div style={styles.priceBadge}>${item.price}</div>
                  </div>
                  <div style={styles.cardInfo}>
                    <h4 style={styles.itemName}>{item.name}</h4>
                    <button style={styles.addBtn}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <Package size={48} />
                <p>No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Billing */}
        <div className="glass-card" style={styles.billSide}>
          <div style={styles.billHeader}>
            <h3>Current Order</h3>
            <ShoppingCart size={24} />
          </div>

          <div style={styles.cartItemsList}>
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item._id} style={styles.cartItem}>
                  <div style={styles.cartItemInfo}>
                    <p style={styles.cartItemName}>{item.name}</p>
                    <p style={styles.cartItemPrice}>${item.price} x {item.quantity}</p>
                  </div>
                  <div style={styles.qtyControls}>
                    <button onClick={() => updateQuantity(item._id, -1)} style={styles.qtyBtn}><Minus size={14} /></button>
                    <span style={styles.qtyValue}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} style={styles.qtyBtn}><Plus size={14} /></button>
                    <button onClick={() => removeFromCart(item._id)} style={styles.removeBtn}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyCart}>
                <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Your cart is empty</p>
              </div>
            )}
          </div>

          <div style={styles.billFooter}>
            <div style={styles.billSummary}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                <span>Total Amount</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handlePrint} 
              style={styles.printBtn} 
              className="btn-primary"
              disabled={cart.length === 0}
            >
              <Printer size={20} /> Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Print-only View (Hidden in normal UI) */}
      <div id="print-area" style={styles.printOnly}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2>ANGARA RESTAURANT</h2>
          <p>Order Summary</p>
          <hr />
        </div>
        {cart.map(item => (
          <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>{item.name} x {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Grand Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Thank you for your visit!</p>
      </div>
    </Layout>
  );
};

const styles = {
  posContainer: {
    display: 'flex',
    gap: '2rem',
    height: 'calc(100vh - 180px)',
  },
  menuSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  menuHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchContainer: {
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
    padding: '0.9rem 1rem 0.9rem 3rem',
    borderRadius: '12px',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    fontSize: '1rem',
  },
  categoriesScroll: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  catTab: {
    padding: '0.6rem 1.25rem',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
  },
  itemsGrid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem',
    paddingRight: '0.5rem',
  },
  itemCard: {
    padding: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    height: 'fit-content',
  },
  itemImageContainer: {
    position: 'relative',
    height: '110px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  priceBadge: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'var(--primary-yellow)',
    color: '#000',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '800',
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  addBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    color: 'var(--primary-yellow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  billSide: {
    width: '360px',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem',
    backgroundColor: 'var(--bg-card)',
  },
  billHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    color: 'var(--text-main)',
  },
  cartItemsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
    paddingRight: '0.4rem',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.75rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
  },
  cartItemName: {
    fontWeight: '600',
    fontSize: '0.85rem',
    color: 'var(--text-main)',
  },
  cartItemPrice: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-main)',
    minWidth: '20px',
    textAlign: 'center',
  },
  removeBtn: {
    color: 'var(--accent-red)',
    marginLeft: '0.4rem',
    opacity: 0.7,
  },
  billFooter: {
    borderTop: '1px solid var(--glass-border)',
    paddingTop: '0.75rem',
  },
  billSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '1rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  totalRow: {
    marginTop: '0.4rem',
    paddingTop: '0.4rem',
    borderTop: '1px dashed var(--glass-border)',
    color: 'var(--text-main)',
    fontSize: '1rem',
    fontWeight: '800',
  },
  printBtn: {
    width: '100%',
    padding: '0.8rem',
    gap: '0.5rem',
    fontSize: '0.95rem',
  },
  emptyCart: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    opacity: 0.5,
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    color: 'var(--text-muted)',
    gap: '1rem',
    opacity: 0.5,
  },
  printOnly: {
    display: 'none',
  }
};

// Add this to your index.css for printing
const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  #print-area, #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 2rem;
    color: black !important;
  }
}
`;

export default POS;
