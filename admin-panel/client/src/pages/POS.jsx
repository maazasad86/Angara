import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Spinner } from '../components/ui/spinner-1';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, Package, Tag, X, Clock } from 'lucide-react';

const POS = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Cart/Bill State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Takeaway');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const [printType, setPrintType] = useState('RECEIPT');
  const [heldOrders, setHeldOrders] = useState([]);
  const [showHeldModal, setShowHeldModal] = useState(false);
  
  // Custom Modal for Hold Bill
  const [showHoldPrompt, setShowHoldPrompt] = useState(false);
  const [holdNoteInput, setHoldNoteInput] = useState('');

  useEffect(() => {
    fetchData();
    const storedHolds = localStorage.getItem('angaara_held_orders');
    if (storedHolds) {
      try {
        setHeldOrders(JSON.parse(storedHolds));
      } catch (e) { console.error(e); }
    }
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes, dealsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/categories'),
        axios.get('http://localhost:5000/api/deals')
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
      setDeals(dealsRes.data);
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

  const displayItems = activeCategory === 'Deals'
    ? deals.filter(deal => deal.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.category?.name === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

  const handlePrintKOT = () => {
    setPrintType('KOT');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleHoldOrderClick = () => {
    if (cart.length === 0) return;
    setHoldNoteInput('');
    setShowHoldPrompt(true);
  };

  const confirmHoldOrder = () => {
    const note = holdNoteInput.trim() || `Order ${new Date().toLocaleTimeString()}`;
    const newHold = {
      id: Date.now().toString(),
      note,
      cart,
      orderType,
      customerName,
      customerPhone,
      total,
      time: new Date().toLocaleTimeString()
    };
    const updatedHolds = [...heldOrders, newHold];
    setHeldOrders(updatedHolds);
    localStorage.setItem('angaara_held_orders', JSON.stringify(updatedHolds));
    
    setCart([]);
    setOrderType('Takeaway');
    setCustomerName('');
    setCustomerPhone('');
    setShowHoldPrompt(false);
  };

  const handleResumeOrder = (heldOrder) => {
    if (cart.length > 0) {
      if (!window.confirm("Current cart is not empty. Replace it?")) return;
    }
    setCart(heldOrder.cart);
    setOrderType(heldOrder.orderType);
    setCustomerName(heldOrder.customerName || '');
    setCustomerPhone(heldOrder.customerPhone || '');
    
    const updatedHolds = heldOrders.filter(h => h.id !== heldOrder.id);
    setHeldOrders(updatedHolds);
    localStorage.setItem('angaara_held_orders', JSON.stringify(updatedHolds));
    setShowHeldModal(false);
  };
  
  const handleDeleteHold = (id) => {
    if(!window.confirm("Delete this parked order permanently?")) return;
    const updatedHolds = heldOrders.filter(h => h.id !== id);
    setHeldOrders(updatedHolds);
    localStorage.setItem('angaara_held_orders', JSON.stringify(updatedHolds));
  };

  const handleCheckoutAndPrint = async () => {
    setPrintType('RECEIPT');
    try {
      const saleItems = cart.map(item => ({
        itemId: item._id,
        name: item.name,
        type: item.items ? 'deal' : 'item',
        categoryName: item.items ? 'Deals' : (item.category?.name || 'Uncategorized'),
        price: item.price,
        quantity: item.quantity
      }));

      await axios.post('http://localhost:5000/api/sales', {
        items: saleItems,
        totalAmount: total,
        orderType,
        customerName: orderType === 'Delivery' ? customerName : '',
        customerPhone: orderType === 'Delivery' ? customerPhone : ''
      });

      setTimeout(() => {
        window.print();
        setCart([]);
        setOrderType('Takeaway');
        setCustomerName('');
        setCustomerPhone('');
      }, 100);
    } catch (err) {
      console.error('Error recording sale:', err);
      alert('Failed to save sale to records: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Layout>
      <div className="responsive-flex" style={styles.posContainer}>
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
              <button 
                onClick={() => setActiveCategory('Deals')}
                style={{
                  ...styles.catTab,
                  backgroundColor: activeCategory === 'Deals' ? 'var(--primary-yellow)' : 'var(--glass)',
                  color: activeCategory === 'Deals' ? '#000' : 'var(--text-main)',
                }}
              >
                Deals
              </button>
            </div>
          </div>

          <div className="items-grid" style={styles.itemsGrid}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gridColumn: '1 / -1' }}>
                <Spinner size={40} color="var(--primary-yellow)" />
              </div>
            ) : displayItems.length > 0 ? (
              displayItems.map(item => {
                const isDeal = !!item.items;
                if (isDeal) {
                  return (
                    <div 
                      key={item._id} 
                      className="glass-card" 
                      style={styles.itemCard}
                      onClick={() => addToCart(item)}
                    >
                      <div style={styles.itemImageContainer}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={styles.itemImage} />
                        ) : (
                          <div style={styles.dealPlaceholder}>
                            <Tag size={40} style={{ color: 'var(--primary-yellow)' }} />
                          </div>
                        )}
                        <div style={styles.priceBadge}>Rs. {item.price}</div>
                      </div>
                      <div style={styles.dealCardInfo}>
                        <div style={styles.dealTextContainer}>
                          <h4 style={styles.itemName} title={item.name}>{item.name}</h4>
                          <p style={styles.dealItemsText} title={item.items.map(di => `${di.quantity}x ${di.item?.name || 'Item'}`).join(', ')}>
                            {item.items.map(di => `${di.quantity}x ${di.item?.name || 'Item'}`).join(', ')}
                          </p>
                        </div>
                        <div style={styles.addBtn}>
                          <Plus size={16} />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={item._id} 
                    className="glass-card" 
                    style={styles.itemCard}
                    onClick={() => addToCart(item)}
                  >
                    <div style={styles.itemImageContainer}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={styles.itemImage} />
                      ) : (
                        <div style={styles.dealPlaceholder}>
                          <Tag size={40} style={{ color: 'var(--primary-yellow)' }} />
                        </div>
                      )}
                      <div style={styles.priceBadge}>Rs. {item.price}</div>
                    </div>
                    <div style={styles.cardInfo}>
                      <h4 style={styles.itemName}>{item.name}</h4>
                      <div style={styles.addBtn}>
                        <Plus size={16} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>
                <Package size={48} />
                <p>No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Billing */}
        <div className="glass-card fixed-side-panel" style={styles.billSide}>
          <div style={styles.billHeader}>
            <h3 style={{ fontWeight: '800' }}>Current Bill</h3>
            <ShoppingCart size={24} />
          </div>

          <div style={styles.orderTypeSelector}>
            {['Dine-in', 'Takeaway', 'Delivery'].map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                style={{
                  ...styles.orderTypeBtn,
                  backgroundColor: orderType === type ? 'var(--primary-yellow)' : 'rgba(255, 255, 255, 0.05)',
                  color: orderType === type ? '#000' : 'var(--text-main)',
                  borderColor: orderType === type ? 'var(--primary-yellow)' : 'var(--glass-border)'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {orderType === 'Delivery' && (
            <div style={styles.customerInfoContainer}>
              <input 
                type="text" 
                placeholder="Phone (e.g. 0300...)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ ...styles.customerInput, flex: 1, minWidth: 0 }}
              />
              <input 
                type="text" 
                placeholder="Customer Name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ ...styles.customerInput, flex: 1, minWidth: 0 }}
              />
            </div>
          )}

          <div style={styles.cartItemsList}>
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item._id} style={styles.cartItem}>
                  <div style={styles.cartItemInfo}>
                    <p style={styles.cartItemName}>{item.name}</p>
                    <p style={styles.cartItemPrice}>Rs. {item.price} x {item.quantity}</p>
                    {/* Nested Deal Items in Card Badge Style */}
                    {item.items && item.items.length > 0 && (
                      <div style={styles.dealItemsContainer}>
                        {item.items.map((di, idx) => (
                          <div key={idx} style={styles.dealItemCard}>
                            <span style={styles.dealItemQty}>{di.quantity}x</span>
                            <span style={styles.dealItemName}>{di.item?.name || 'Item'}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>Your cart is empty</p>
              </div>
            )}
          </div>

          <div style={styles.billFooter}>
            <div style={styles.billSummary}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                <span>Final Amount</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={handleHoldOrderClick} 
                style={{...styles.printBtn, flex: 1, backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)'}}
                disabled={cart.length === 0}
              >
                Hold Bill
              </button>
              <button 
                onClick={() => setShowHeldModal(true)} 
                style={{...styles.printBtn, flex: 1, backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)'}}
              >
                Pending Bills ({heldOrders.length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handlePrintKOT} 
                style={{...styles.printBtn, flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none'}}
                disabled={cart.length === 0}
              >
                Kitchen Slip
              </button>
              <button 
                onClick={handleCheckoutAndPrint} 
                style={{...styles.printBtn, flex: 1.5}} 
                className="btn-primary"
                disabled={cart.length === 0}
              >
                <Printer size={18} /> Pay & Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="print-area" style={styles.printOnly}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2>{printType === 'KOT' ? 'KOT - KITCHEN' : 'ANGARA RESTAURANT'}</h2>
          <p>{printType === 'KOT' ? 'Kitchen Order Ticket' : 'Order Summary'}</p>
          <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: '0.5rem 0', padding: '0.2rem', border: '1px solid #000' }}>{orderType.toUpperCase()}</p>
          {(orderType === 'Delivery' || orderType === 'Takeaway' || orderType === 'Dine-in') && (
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {customerName && <p>Name: {customerName}</p>}
              {customerPhone && <p>Phone: {customerPhone}</p>}
            </div>
          )}
          <hr />
        </div>
        {cart.map(item => (
          <div key={item._id} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name}</span>
              {printType === 'RECEIPT' && <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>}
            </div>
            {/* If it's a Deal, list sub-items on receipt */}
            {item.items && item.items.length > 0 && (
              <div style={{ paddingLeft: '1rem', fontSize: '0.85rem', color: '#555', marginTop: '0.15rem' }}>
                {item.items.map((di, idx) => (
                  <div key={idx}>
                    - {di.quantity}x {di.item?.name || 'Item'}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <hr />
        {printType === 'RECEIPT' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Grand Total</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>
        )}
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          {printType === 'KOT' ? `Time: ${new Date().toLocaleTimeString()}` : 'Thank you for your visit!'}
        </p>
      </div>

      {/* Held Orders Modal */}
      {showHeldModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}><Clock size={24} /> Pending Bills ({heldOrders.length})</h2>
              <button onClick={() => setShowHeldModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {heldOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No pending bills right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {heldOrders.map(ho => (
                  <div key={ho.id} style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{ho.note}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ho.time}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      <span style={{ color: 'var(--primary-yellow)', fontWeight: 'bold' }}>{ho.orderType}</span> • Rs. {ho.total} • {ho.cart.length} items
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleResumeOrder(ho)} style={{ flex: 1, padding: '0.6rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Load Bill</button>
                      <button onClick={() => handleDeleteHold(ho.id)} style={{ padding: '0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hold Bill Prompt Modal */}
      {showHoldPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem' }}>Hold Bill</h2>
              <button onClick={() => setShowHoldPrompt(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Enter Table No. or Customer Name (e.g., Table 4, Ali):</p>
            
            <input 
              type="text" 
              value={holdNoteInput}
              onChange={(e) => setHoldNoteInput(e.target.value)}
              placeholder="Note / Table No."
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg)', color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1rem' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmHoldOrder()}
            />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowHoldPrompt(false)} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={confirmHoldOrder} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save Bill</button>
            </div>
          </div>
        </div>
      )}
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
    overflow: 'hidden',
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
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    paddingRight: '0.55rem',
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
    aspectRatio: '4/3',
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
    fontSize: '0.75rem',
    fontWeight: '800',
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealCardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.4rem',
  },
  dealTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  dealItemsText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '0.2rem',
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
    width: '380px',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-card)',
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  billHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    color: 'var(--text-main)',
  },
  orderTypeSelector: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  orderTypeBtn: {
    flex: 1,
    padding: '0.3rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '700',
    transition: 'all 0.2s',
  },
  customerInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.4rem',
    marginBottom: '0.5rem',
  },
  customerInput: {
    width: '100%',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
  },
  cartItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
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
    fontSize: '1.1rem',
    fontWeight: '800',
  },
  printBtn: {
    width: '100%',
    padding: '0.4rem',
    gap: '0.4rem',
    fontSize: '0.8rem',
    borderRadius: '10px',
    fontWeight: '700',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    opacity: 0.5,
    padding: '2rem 0',
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
  dealPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
  },
  dealItemsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginTop: '0.6rem',
  },
  dealItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    padding: '0.3rem 0.6rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
  },
  dealItemQty: {
    color: 'var(--primary-yellow)',
    fontWeight: '700',
  },
  dealItemName: {
    color: 'var(--text-main)',
  },
  whatsappDealCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  },
  whatsappDealHeader: {
    backgroundColor: '#1c1917',
    color: '#ffffff',
    textAlign: 'center',
    padding: '0.6rem',
    fontWeight: '800',
    fontSize: '0.95rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    borderBottom: '2px solid var(--glass-border)',
  },
  whatsappDealItems: {
    padding: '0.8rem 1rem',
    backgroundColor: 'rgba(250, 204, 21, 0.03)',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    minHeight: '80px',
  },
  whatsappDealItemRow: {
    fontSize: '0.8rem',
    color: 'var(--text-main)',
    fontWeight: '600',
    textAlign: 'left',
  },
  whatsappDealImageContainerSmall: {
    aspectRatio: '16/9',
    width: '100%',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid var(--glass-border)',
    borderBottom: '1px solid var(--glass-border)',
  },
  whatsappDealImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  whatsappDealPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
  },
  whatsappDealPrice: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    textAlign: 'center',
    padding: '0.6rem',
    fontWeight: '800',
    fontSize: '0.95rem',
    letterSpacing: '0.5px',
  },
  printOnly: {
    display: 'none',
  }
};

export default POS;
