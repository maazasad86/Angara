import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Spinner } from '../components/ui/spinner-1';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, Package, Tag, X, Clock } from 'lucide-react';

const POS = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart/Bill State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [printType, setPrintType] = useState('RECEIPT');
  const [heldOrders, setHeldOrders] = useState([]);
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Custom Modal for Hold Bill
  const [showHoldPrompt, setShowHoldPrompt] = useState(false);
  const [holdNoteInput, setHoldNoteInput] = useState('');

  // Custom Modal for Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Cash Calculator / Checkout Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  // Shift Management State
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [drawerCashInput, setDrawerCashInput] = useState('');

  // Variant Selection State
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariantItem, setSelectedVariantItem] = useState(null);
  const [variantQuantities, setVariantQuantities] = useState({});

  // Deal Variant Selection State
  const [showDealVariantModal, setShowDealVariantModal] = useState(false);
  const [selectedDealForVariants, setSelectedDealForVariants] = useState(null);
  const [selectedDealVariants, setSelectedDealVariants] = useState({});

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

  const addToCart = (item, chosenVariant = null, chosenDealItemVariants = null, customQuantity = 1) => {
    // 1. If it's a Deal
    if (item.items) {
      // Find sub-items that have variants but DO NOT have a preset variant selected in the deal config
      const itemsWithVariants = item.items.filter(di => di.item && di.item.variants && di.item.variants.length > 0 && !di.variant);
      if (itemsWithVariants.length > 0 && !chosenDealItemVariants) {
        setSelectedDealForVariants(item);
        // Pre-select the first variant for each item that needs selection
        const initialSelections = {};
        item.items.forEach((di, idx) => {
          if (di.item && di.item.variants && di.item.variants.length > 0 && !di.variant) {
            initialSelections[idx] = di.item.variants[0];
          }
        });
        setSelectedDealVariants(initialSelections);
        setShowDealVariantModal(true);
        return;
      }
    }

    // 2. If it's a regular item that has variants and no variant has been selected yet
    if (!item.items && item.variants && item.variants.length > 0 && !chosenVariant) {
      setSelectedVariantItem(item);
      const initialQuantities = {};
      item.variants.forEach(v => {
        initialQuantities[v.name] = 0;
      });
      setVariantQuantities(initialQuantities);
      setShowVariantModal(true);
      return;
    }

    setCart(prev => {
      let cartItemId = item._id;
      let itemName = item.name;
      let itemPrice = item.price;
      let clonedItems = item.items ? [...item.items] : null;

      if (item.items) {
        // Build the unique suffix by combining preset variants and custom chosen variants
        const suffixParts = [];
        clonedItems = item.items.map((di, idx) => {
          let vName = di.variant;
          if (chosenDealItemVariants && chosenDealItemVariants[idx]) {
            vName = chosenDealItemVariants[idx].name;
          }
          if (vName) {
            suffixParts.push(`${idx}-${vName}`);
            return {
              ...di,
              chosenVariant: vName
            };
          }
          return di;
        });

        if (suffixParts.length > 0) {
          cartItemId = `${item._id}-${suffixParts.join('-')}`;

          // Construct inline text description of selected variants
          const selectedText = clonedItems
            .filter(di => di.chosenVariant)
            .map(di => di.chosenVariant)
            .join(', ');

          itemName = `${item.name} (${selectedText})`;
        }
      } else if (chosenVariant) {
        // Regular item with variant
        cartItemId = `${item._id}-${chosenVariant.name}`;
        itemName = `${item.name} (${chosenVariant.name})`;
        itemPrice = chosenVariant.price;
      }

      const existing = prev.find(i => i._id === cartItemId);
      if (existing) {
        return prev.map(i => i._id === cartItemId ? { ...i, quantity: i.quantity + customQuantity } : i);
      }
      return [...prev, {
        ...item,
        _id: cartItemId,
        originalId: item._id,
        name: itemName,
        price: itemPrice,
        items: clonedItems,
        chosenVariant: chosenVariant ? chosenVariant.name : null,
        quantity: customQuantity
      }];
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
      const matchesSubCategory = activeSubCategory === 'All' || item.subCategory === activeSubCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSubCategory && matchesSearch;
    });

  const groupedItems = useMemo(() => {
    if (activeCategory === 'Deals') {
      return { 'Deals': displayItems };
    }

    const groups = {};
    displayItems.forEach(item => {
      const sub = item.subCategory && item.subCategory.trim() ? item.subCategory.trim() : 'Uncategorized';
      if (!groups[sub]) {
        groups[sub] = [];
      }
      groups[sub].push(item);
    });

    // Sort keys based on category's defined subCategories array
    const currentCategoryObj = categories.find(cat => cat.name === activeCategory);
    const orderedSubCats = currentCategoryObj?.subCategories || [];

    const sortedGroups = {};

    // First, add groups in the order specified by the category
    orderedSubCats.forEach(sub => {
      const matchingKey = Object.keys(groups).find(k => k.toLowerCase() === sub.toLowerCase());
      if (matchingKey) {
        sortedGroups[matchingKey] = groups[matchingKey];
        delete groups[matchingKey];
      }
    });

    // Then, add any remaining groups (e.g. Uncategorized or dynamically added ones)
    Object.keys(groups).forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [displayItems, activeCategory, categories]);

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
    setOrderType('Dine-in');
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

  const handleDeleteHoldClick = (id) => {
    setOrderToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteHold = () => {
    if (!orderToDelete) return;
    const updatedHolds = heldOrders.filter(h => h.id !== orderToDelete);
    setHeldOrders(updatedHolds);
    localStorage.setItem('angaara_held_orders', JSON.stringify(updatedHolds));
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const handleOpenShiftModal = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/current-shift');
      setShiftData(res.data);
      setDrawerCashInput(''); // Explicitly empty
      setShowShiftModal(true);
    } catch (err) {
      alert("Failed to load shift data: " + err.message);
    }
  };

  const submitShiftClose = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/reports/close-shift', {
        drawerCash: drawerCashInput,
        notes: 'Closed via POS'
      });

      const report = res.data;

      const diff = report.difference;
      const statusText = diff === 0 ? "Exact Match" : diff < 0 ? `Shortage: Rs. ${Math.abs(diff)}` : `Excess: Rs. ${diff}`;

      const msg = `*ANGARA RESTAURANT - Z-REPORT*%0A--------------------%0A*Orders:* ${report.totalOrders}%0A*System Cash:* Rs. ${report.systemCash}%0A*Drawer Cash:* Rs. ${report.drawerCash}%0A*Status:* ${statusText}%0A--------------------%0A*Time:* ${new Date().toLocaleTimeString()}`;

      window.open(`https://wa.me/?text=${msg}`, '_blank');

      setShowShiftModal(false);
      setShiftData(null);
      setDrawerCashInput('');
      alert("Shift Closed Successfully!");

    } catch (err) {
      alert("Failed to close shift: " + err.message);
    }
  };

  const handleCheckoutAndPrint = async () => {
    setPrintType('RECEIPT');
    try {
      const saleItems = cart.map(item => ({
        itemId: item.originalId || item._id,
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
        setOrderType('Dine-in');
        setCustomerName('');
        setCustomerPhone('');
        setShowCheckoutModal(false);
        setCashReceived('');
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
                onClick={() => { setActiveCategory('All'); setActiveSubCategory('All'); }}
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
                  onClick={() => { setActiveCategory(cat.name); setActiveSubCategory('All'); }}
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
                onClick={() => { setActiveCategory('Deals'); setActiveSubCategory('All'); }}
                style={{
                  ...styles.catTab,
                  backgroundColor: activeCategory === 'Deals' ? 'var(--primary-yellow)' : 'var(--glass)',
                  color: activeCategory === 'Deals' ? '#000' : 'var(--text-main)',
                }}
              >
                Deals
              </button>
            </div>

            {activeCategory !== 'All' && activeCategory !== 'Deals' && (
              (() => {
                const currentCat = categories.find(cat => cat.name === activeCategory);
                const subCats = currentCat?.subCategories || [];
                if (subCats.length === 0) return null;
                return (
                  <div style={styles.subCategoriesScroll}>
                    <button
                      onClick={() => setActiveSubCategory('All')}
                      style={{
                        ...styles.subCatTab,
                        backgroundColor: activeSubCategory === 'All' ? 'var(--primary-yellow)' : 'var(--glass)',
                        color: activeSubCategory === 'All' ? '#000' : 'var(--text-main)',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      All Option
                    </button>
                    {subCats.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSubCategory(sub)}
                        style={{
                          ...styles.subCatTab,
                          backgroundColor: activeSubCategory === sub ? 'var(--primary-yellow)' : 'var(--glass)',
                          color: activeSubCategory === sub ? '#000' : 'var(--text-main)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        {sub.includes(' / ') ? sub.replace(' / ', ' ➔ ') : sub}
                      </button>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          <div className="items-container" style={styles.itemsContainer}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', width: '100%' }}>
                <Spinner size={40} color="var(--primary-yellow)" />
              </div>
            ) : Object.keys(groupedItems).length > 0 ? (
              Object.keys(groupedItems).map(subCat => {
                const groupItems = groupedItems[subCat];
                const showHeading = Object.keys(groupedItems).length > 1 || (subCat !== 'Uncategorized' && subCat !== 'Deals');

                return (
                  <div key={subCat} style={styles.subCatSection}>
                    {showHeading && (
                      <h4 style={styles.subCatHeading}>{subCat}</h4>
                    )}
                    <div className="items-grid" style={styles.itemsGrid}>
                      {groupItems.map(item => {
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
                              <div style={styles.cardInfo}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                                  <h4 style={{ ...styles.itemName, margin: 0 }} title={item.name}>{item.name}</h4>
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
                              <div style={styles.priceBadge}>
                                {item.variants && item.variants.length > 0 ? (
                                  `Rs. ${Math.min(...item.variants.map(v => v.price || 0))}+`
                                ) : (
                                  `Rs. ${item.price}`
                                )}
                              </div>
                            </div>
                            <div style={styles.cardInfo}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                                <h4 style={{ ...styles.itemName, margin: 0 }} title={item.name}>{item.name}</h4>
                                {item.variants && item.variants.length > 0 && (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--primary-yellow)',
                                    marginTop: '4px',
                                    fontWeight: '700'
                                  }}>
                                    {item.variants.length} Options
                                  </span>
                                )}
                              </div>
                              <div style={styles.addBtn}>
                                <Plus size={16} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
            <button onClick={handleOpenShiftModal} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Close Shift (Z)</button>
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
                            <span style={styles.dealItemName}>
                              {di.item?.name || 'Item'}
                              {(di.variant || di.chosenVariant) ? ` (${di.variant || di.chosenVariant})` : ''}
                            </span>
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
                <ShoppingCart size={32} style={{ opacity: 0.1, marginBottom: '0.5rem' }} />
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
                style={{ ...styles.printBtn, flex: 1, backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                disabled={cart.length === 0}
              >
                Hold Bill
              </button>
              <button
                onClick={() => setShowHeldModal(true)}
                style={{ ...styles.printBtn, flex: 1, backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
              >
                Pending Bills ({heldOrders.length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handlePrintKOT}
                style={{ ...styles.printBtn, flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                disabled={cart.length === 0}
              >
                Kitchen Slip
              </button>
              <button
                onClick={() => {
                  setCashReceived(''); // Explicitly empty
                  setShowCheckoutModal(true);
                }}
                style={{ ...styles.printBtn, flex: 1.5 }}
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
                    - {di.quantity}x {di.item?.name || 'Item'}{(di.variant || di.chosenVariant) ? ` (${di.variant || di.chosenVariant})` : ''}
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
                      <button onClick={() => handleDeleteHoldClick(ho.id)} style={{ padding: '0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem', color: '#ef4444' }}>
              <Trash2 size={48} />
            </div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete Pending Bill?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Are you sure you want to permanently delete this parked bill? This action cannot be undone.</p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={confirmDeleteHold} style={{ flex: 1, padding: '0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Calculator / Checkout Modal */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-card" style={{ width: '380px', padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Cash & Checkout</h2>
              <button onClick={() => setShowCheckoutModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem', backgroundColor: 'rgba(250, 204, 21, 0.1)', borderRadius: '8px', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>Total Bill:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-yellow)' }}>Rs. {total.toFixed(0)}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cash Received (Rs.)</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid var(--glass-border)', backgroundColor: 'var(--bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '700', textAlign: 'right' }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCheckoutAndPrint()}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
              <button onClick={() => setCashReceived(total.toString())} style={{ flex: 1, padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Exact</button>
              <button onClick={() => setCashReceived('500')} style={{ flex: 1, padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>500</button>
              <button onClick={() => setCashReceived('1000')} style={{ flex: 1, padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>1000</button>
              <button onClick={() => setCashReceived('5000')} style={{ flex: 1, padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>5000</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Change to Return:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: (Number(cashReceived) - total) >= 0 ? '#4ade80' : '#ef4444' }}>
                Rs. {cashReceived ? (Number(cashReceived) - total).toFixed(0) : '0'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => setShowCheckoutModal(false)} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={handleCheckoutAndPrint} style={{ flex: 2, padding: '0.8rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Printer size={18} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift (Z-Report) Modal */}
      {showShiftModal && shiftData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-card" style={{ width: '380px', padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Close Shift (Z-Report)</h2>
              <button onClick={() => setShowShiftModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', padding: '0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>System Cash:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Rs. {shiftData.systemCash}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Orders:</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{shiftData.totalOrders}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Actual Drawer Cash (Rs.)</label>
              <input
                type="number"
                value={drawerCashInput}
                onChange={(e) => setDrawerCashInput(e.target.value)}
                placeholder="Count cash..."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid var(--glass-border)', backgroundColor: 'var(--bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '700', textAlign: 'right' }}
                autoFocus
              />
            </div>

            {drawerCashInput && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: (Number(drawerCashInput) - shiftData.systemCash) >= 0 ? (Number(drawerCashInput) === shiftData.systemCash ? '#a3e635' : '#facc15') : '#ef4444' }}>
                  {Number(drawerCashInput) - shiftData.systemCash === 0 ? 'Exact Match' :
                    Number(drawerCashInput) - shiftData.systemCash > 0 ? `Excess: Rs. ${Number(drawerCashInput) - shiftData.systemCash}` :
                      `Shortage: Rs. ${Math.abs(Number(drawerCashInput) - shiftData.systemCash)}`}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => setShowShiftModal(false)} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={submitShiftClose} style={{ flex: 2, padding: '0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Close & Send
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Variant Selection Modal */}
      {showVariantModal && selectedVariantItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-card" style={{ width: '380px', padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Select Variant / Option</h3>
              <button onClick={() => setShowVariantModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Choose quantities for <strong style={{ color: 'var(--text-main)' }}>{selectedVariantItem.name}</strong> options:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedVariantItem.variants.map((v, idx) => {
                const qty = variantQuantities[v.name] || 0;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: qty > 0 ? 'var(--primary-yellow)' : 'var(--glass-border)',
                      backgroundColor: qty > 0 ? 'rgba(250, 204, 21, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{v.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-yellow)', fontWeight: '700' }}>Rs. {v.price}</span>
                    </div>

                    {/* Quantity Selector for this variant */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setVariantQuantities(prev => ({
                            ...prev,
                            [v.name]: Math.max(0, qty - 1)
                          }));
                        }}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: qty > 0 ? 'var(--text-main)' : 'var(--text-muted)', minWidth: '20px', textAlign: 'center' }}>
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVariantQuantities(prev => ({
                            ...prev,
                            [v.name]: qty + 1
                          }));
                        }}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => setShowVariantModal(false)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  let addedAny = false;
                  selectedVariantItem.variants.forEach(v => {
                    const qty = variantQuantities[v.name] || 0;
                    if (qty > 0) {
                      addToCart(selectedVariantItem, v, null, qty);
                      addedAny = true;
                    }
                  });
                  if (addedAny) {
                    setShowVariantModal(false);
                    setSelectedVariantItem(null);
                    setVariantQuantities({});
                  }
                }}
                style={{ flex: 2, padding: '0.75rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={!Object.values(variantQuantities).some(q => q > 0)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Variant Selection Modal */}
      {showDealVariantModal && selectedDealForVariants && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="glass-card" style={{ width: '420px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Select Variants for Deal</h3>
              <button onClick={() => setShowDealVariantModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Choose options for the items in <strong style={{ color: 'var(--text-main)' }}>{selectedDealForVariants.name}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {selectedDealForVariants.items.map((di, idx) => {
                const hasVariants = di.item && di.item.variants && di.item.variants.length > 0;
                if (!hasVariants) return null;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {di.item.name} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>(Qty: {di.quantity})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {di.item.variants.map((v, vIdx) => {
                        const isSelected = selectedDealVariants[idx]?.name === v.name;
                        return (
                          <label
                            key={vIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.6rem 0.8rem',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--primary-yellow)' : 'var(--glass-border)',
                              backgroundColor: isSelected ? 'rgba(250, 204, 21, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              setSelectedDealVariants(prev => ({
                                ...prev,
                                [idx]: v
                              }));
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="radio"
                                name={`deal-variant-group-${idx}`}
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedDealVariants(prev => ({
                                    ...prev,
                                    [idx]: v
                                  }));
                                }}
                                style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary-yellow)' }}
                              />
                              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{v.name}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-yellow)' }}>Rs. {v.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => setShowDealVariantModal(false)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addToCart(selectedDealForVariants, null, selectedDealVariants);
                  setShowDealVariantModal(false);
                  setSelectedDealForVariants(null);
                  setSelectedDealVariants({});
                }}
                style={{ flex: 2, padding: '0.75rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Confirm Options
              </button>
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
    gap: '1.25rem',
    height: 'calc(100vh - 120px)',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  menuSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflow: 'hidden',
    minWidth: 0,
  },
  menuHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    minWidth: 0,
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
    width: '100%',
    minWidth: 0,
  },
  catTab: {
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
  },
  subCatTab: {
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.72rem',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
  },
  subCategoriesScroll: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    marginTop: '0.75rem',
    width: '100%',
    minWidth: 0,
  },
  itemsContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    paddingRight: '0.55rem',
  },
  subCatSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  subCatHeading: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '0.3rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.75rem',
  },
  itemCard: {
    padding: '0.6rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    height: '100%',
  },
  itemImageContainer: {
    position: 'relative',
    height: '95px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
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
    marginTop: 'auto',
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
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-main)',
    lineHeight: '1.2',
    wordBreak: 'break-word',
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
    padding: '1rem 0',
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
