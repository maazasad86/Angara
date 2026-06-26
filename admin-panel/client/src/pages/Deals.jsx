import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { Spinner } from '../components/ui/spinner-1';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Tag, 
  ArrowLeft, 
  Save,
  Edit2,
  Upload,
  MoreVertical,
  X
} from 'lucide-react';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Search & Filter state for item selection
  const [activeCategory, setActiveCategory] = useState('All');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Deal state
  const [dealName, setDealName] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [dealImage, setDealImage] = useState(null);
  const [dealImagePreview, setDealImagePreview] = useState(null);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, dealId: null });

  // Variant Selection State in Deal Creator
  const [showItemVariantModal, setShowItemVariantModal] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);
  const [variantQuantities, setVariantQuantities] = useState({});

  useEffect(() => {
    fetchData();
    
    const closeMenus = () => setActiveMenuId(null);
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  const toggleMenu = (dealId, e) => {
    e.stopPropagation();
    setActiveMenuId(prev => (prev === dealId ? null : dealId));
  };

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

  const handleDealImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDealImage(file);
      setDealImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateNew = () => {
    setDealName('');
    setDealPrice('');
    setSelectedItems([]);
    setDealImage(null);
    setDealImagePreview(null);
    setEditingId(null);
    setIsCreating(true);
  };

  const handleEdit = (deal) => {
    setDealName(deal.name);
    setDealPrice(deal.price);
    setSelectedItems(deal.items.filter(i => i.item).map(i => {
      const isVar = !!i.variant;
      const vObj = isVar && i.item?.variants?.find(v => v.name === i.variant);
      return {
        ...i.item,
        uniqueId: i.variant ? `${i.item._id}-${i.variant}` : i.item._id,
        name: i.variant ? `${i.item.name} (${i.variant})` : i.item.name,
        price: vObj ? vObj.price : (i.item?.price || 0),
        chosenVariant: i.variant || null,
        quantity: i.quantity
      };
    }));
    setDealImage(null);
    setDealImagePreview(deal.image || null);
    setEditingId(deal._id);
    setIsCreating(true);
  };

  const confirmDelete = (id) => {
    setConfirmModal({ isOpen: true, dealId: id });
    setActiveMenuId(null);
  };

  const handleDelete = async () => {
    const id = confirmModal.dealId;
    if (!id) return;
    try {
      await axios.delete(`http://localhost:5000/api/deals/${id}`);
      setDeals(deals.filter(d => d._id !== id));
      setConfirmModal({ isOpen: false, dealId: null });
    } catch (err) {
      console.error(err);
    }
  };

  const addToDeal = (item, chosenVariant = null, customQuantity = 1) => {
    if (item.variants && item.variants.length > 0 && !chosenVariant) {
      setSelectedItemForVariant(item);
      const initialQuantities = {};
      item.variants.forEach(v => {
        initialQuantities[v.name] = 0;
      });
      if (item.variants.length > 0) {
        initialQuantities[item.variants[0].name] = 1;
      }
      setVariantQuantities(initialQuantities);
      setShowItemVariantModal(true);
      return;
    }

    setSelectedItems(prev => {
      const uniqueId = chosenVariant ? `${item._id}-${chosenVariant.name}` : item._id;
      const itemName = chosenVariant ? `${item.name} (${chosenVariant.name})` : item.name;
      const itemPrice = chosenVariant ? chosenVariant.price : item.price;

      const existing = prev.find(i => (i.uniqueId || i._id) === uniqueId);
      if (existing) {
        return prev.map(i => (i.uniqueId || i._id) === uniqueId ? { ...i, quantity: i.quantity + customQuantity } : i);
      }
      return [...prev, { 
        ...item, 
        uniqueId,
        name: itemName,
        price: itemPrice,
        chosenVariant: chosenVariant ? chosenVariant.name : null,
        quantity: customQuantity 
      }];
    });
  };

  const removeFromDeal = (uniqueId) => {
    setSelectedItems(prev => prev.filter(i => (i.uniqueId || i._id) !== uniqueId));
  };

  const updateItemQty = (uniqueId, delta) => {
    setSelectedItems(prev => prev.map(i => {
      if ((i.uniqueId || i._id) === uniqueId) {
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

    const data = new FormData();
    data.append('name', dealName);
    data.append('price', dealPrice);
    data.append('items', JSON.stringify(selectedItems.map(i => ({
      item: i._id,
      quantity: i.quantity,
      variant: i.chosenVariant
    }))));
    if (dealImage) {
      data.append('image', dealImage);
    }

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/deals/${editingId}`, data);
        setDeals(deals.map(d => d._id === editingId ? res.data : d));
      } else {
        const res = await axios.post('http://localhost:5000/api/deals', data);
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

  if (loading) return <Layout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', width: '100%' }}><Spinner size={40} color="var(--primary-yellow)" /></div></Layout>;

  return (
    <Layout>
      {!isCreating && (
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <Tag size={28} style={{ color: 'var(--primary-yellow)' }} />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Deals Management</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create and manage combo offers</p>
            </div>
          </div>
          <button onClick={handleCreateNew} className="btn-primary" style={styles.createBtn}>
            <Plus size={20} /> New Deal
          </button>
        </div>
      )}

      {!isCreating ? (
        <div className="items-grid" style={styles.dealsGrid}>
          {deals.length > 0 ? (
            deals.map(deal => (
              <div key={deal._id} className="glass-card" style={styles.menuDealCard}>
                {/* 3-Dot Actions Menu */}
                <div style={styles.menuDotContainer}>
                  <button 
                    onClick={(e) => toggleMenu(deal._id, e)} 
                    style={styles.menuDotBtn}
                    className="hover-scale"
                  >
                    <MoreVertical size={18} style={{ color: 'var(--text-main)' }} />
                  </button>
                  
                  {activeMenuId === deal._id && (
                    <div style={styles.dropdownMenu}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(deal); }} 
                        style={styles.dropdownItem}
                      >
                        <Edit2 size={13} style={{ marginRight: '0.4rem' }} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete(deal._id); }} 
                        style={{ ...styles.dropdownItem, borderBottom: 'none', color: 'var(--accent-red)' }}
                      >
                        <Trash2 size={13} style={{ marginRight: '0.4rem' }} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Header: Deal Name inside white paintbrush-like banner */}
                <div style={styles.menuDealHeaderContainer}>
                  <div style={styles.menuDealHeaderPatch}>
                    {deal.name}
                  </div>
                </div>

                {/* Content Area: Items list */}
                <div style={styles.menuDealItemsArea}>
                  {deal.items.map((di, idx) => (
                    <div key={idx} style={styles.menuDealItemRow} title={`${di.quantity}x ${di.item?.name || 'Deleted Item'}`}>
                      • {di.quantity}x {di.item?.name || 'Deleted Item'}
                    </div>
                  ))}
                </div>

                {/* Image Container */}
                <div style={styles.menuDealImageContainer}>
                  {deal.image ? (
                    <img src={deal.image} alt={deal.name} style={styles.menuDealImage} />
                  ) : (
                    <div style={styles.menuDealPlaceholder}>
                      <Tag size={36} style={{ color: 'var(--primary-yellow)', opacity: 0.8 }} />
                    </div>
                  )}
                </div>

                {/* Price: Dark Red banner patch */}
                <div style={styles.menuDealPriceContainer}>
                  <div style={styles.menuDealPricePatch}>
                    Rs {deal.price}
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
        <div className="responsive-flex" style={styles.creatorContainer}>
          {/* Item Selector Side */}
          <div style={styles.itemsSide}>
            <div style={styles.selectorHeader}>
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

            <div className="items-grid" style={styles.itemsGridSmall}>
              {filteredItems.map(item => (
                <div 
                  key={item._id} 
                  className="glass-card" 
                  style={styles.itemCard}
                  onClick={() => addToDeal(item)}
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
              ))}
            </div>
          </div>

          {/* Deal Config Side */}
          <div className="glass-card fixed-side-panel" style={styles.configSide}>
            <div style={styles.configHeader}>
              <h3 style={{ fontWeight: '800' }}>{editingId ? 'Edit Deal' : 'New Deal Setup'}</h3>
              <Tag size={20} style={{ opacity: 0.5 }} />
            </div>

            {/* Name and Price Row */}
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <div style={{ ...styles.inputGroup, flex: 2 }}>
                <label style={styles.label}>Deal Name / Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. Super Saver Deal 1" 
                  style={styles.majorInput}
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Price (Rs.)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  style={styles.majorInput}
                  value={dealPrice}
                  onChange={(e) => setDealPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Image upload row */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Deal Image</label>
              <div style={styles.dealUploadArea} onClick={(e) => {
                if(e.target.closest('button')) return;
                document.getElementById('dealImageInput').click();
              }}>
                {dealImagePreview ? (
                  <>
                    <img src={dealImagePreview} alt="Deal Preview" style={styles.dealPreviewImg} />
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setDealImage(null); 
                        setDealImagePreview(null); 
                      }} 
                      style={styles.removeImageBtn}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div style={styles.dealUploadPrompt}>
                    <Upload size={20} />
                    <span>Upload Deal Image</span>
                  </div>
                )}
                <input 
                  id="dealImageInput" 
                  type="file" 
                  onChange={handleDealImageChange} 
                  hidden 
                  accept="image/*"
                />
              </div>
            </div>

            {/* Selected Items section */}
            <div style={styles.selectedItemsSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Selected Items ({selectedItems.length})</label>
                {selectedItems.length > 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-yellow)', fontWeight: '800' }}>
                    Total: Rs. {selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
                  </span>
                )}
              </div>
              <div style={styles.selectedItemsScroll}>
                {selectedItems.length > 0 ? (
                  selectedItems.map(item => {
                    const identifier = item.uniqueId || item._id;
                    return (
                      <div key={identifier} style={styles.selectedItem}>
                        <div style={styles.selectedItemLeft}>
                          {item.image && (
                            <img src={item.image} alt={item.name} style={styles.selectedItemThumb} />
                          )}
                          <div style={styles.selInfo}>
                            <p style={styles.selName}>{item.name}</p>
                            <p style={styles.selMeta}>
                              Rs. {item.price} &times; {item.quantity} = <span style={{color:'var(--primary-yellow)', fontWeight:'700'}}>Rs. {item.price * item.quantity}</span>
                            </p>
                          </div>
                        </div>
                        <div style={styles.qtyRow}>
                          <button onClick={() => updateItemQty(identifier, -1)} style={styles.miniQtyBtn}><Minus size={12} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateItemQty(identifier, 1)} style={styles.miniQtyBtn}><Plus size={12} /></button>
                          <button onClick={() => removeFromDeal(identifier)} style={styles.selRemove}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={styles.emptyPrompt}>
                    <Package size={32} style={{ opacity: 0.1, marginBottom: '0.5rem' }} />
                    <p>Select items from the left to build the deal</p>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.saveBtnContainer}>
              <button 
                onClick={() => setIsCreating(false)} 
                className="btn-secondary" 
                style={{...styles.saveBtnWide, borderRadius: '12px', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)'}}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDeal} 
                className="btn-primary" 
                style={styles.saveBtnWide}
                disabled={!dealName || !dealPrice || selectedItems.length === 0}
              >
                <Save size={20} /> {editingId ? 'Update Deal' : 'Save Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Variant Selection Modal in Deal Creator */}
      {showItemVariantModal && selectedItemForVariant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '380px', padding: '1.75rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Select Variant</h3>
              <button onClick={() => setShowItemVariantModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Choose quantities for <strong style={{ color: 'var(--text-main)' }}>{selectedItemForVariant.name}</strong> options:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedItemForVariant.variants.map((v, idx) => {
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
                      backgroundColor: qty > 0 ? 'rgba(250, 204, 21, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>{v.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-yellow)', fontWeight: '700' }}>Rs. {v.price}</span>
                    </div>
                    
                    {/* Quantity Selector */}
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
                onClick={() => setShowItemVariantModal(false)} 
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  let addedAny = false;
                  selectedItemForVariant.variants.forEach(v => {
                    const qty = variantQuantities[v.name] || 0;
                    if (qty > 0) {
                      addToDeal(selectedItemForVariant, v, qty);
                      addedAny = true;
                    }
                  });
                  if (addedAny) {
                    setShowItemVariantModal(false);
                    setSelectedItemForVariant(null);
                    setVariantQuantities({});
                  }
                }} 
                style={{ flex: 2, padding: '0.75rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                disabled={!Object.values(variantQuantities).some(q => q > 0)}
              >
                Add to Deal
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, dealId: null })}
        onConfirm={handleDelete}
        title="Delete Deal"
        message="Are you sure you want to delete this deal? This action cannot be undone."
      />
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
    padding: '0.75rem 1.25rem',
    gap: '0.5rem',
    fontSize: '0.9rem',
  },
  dealsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.25rem',
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
    overflow: 'hidden',
  },
  selectorHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    paddingRight: '0.5rem',
  },
  itemCard: {
    padding: '0.75rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease, background-color 0.2s ease',
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
    backgroundColor: 'rgba(0,0,0,0.15)',
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

  configSide: {
    width: '380px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    background: 'var(--bg-card)',
    height: 'calc(100vh - 200px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
    paddingRight: '0.5rem',
  },
  selectedItemsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  selectedItemsScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    boxSizing: 'border-box',
  },
  saveBtnContainer: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.25rem',
  },
  saveBtnWide: {
    flex: 1,
    padding: '0.6rem 1.5rem',
    gap: '0.5rem',
    fontSize: '0.9rem',
  },
  configHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '0.5rem',
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
    padding: '0.6rem 0.8rem',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '10px',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    fontWeight: '600',
    boxSizing: 'border-box',
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
    padding: '0.5rem 0.6rem',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    boxSizing: 'border-box',
  },
  selInfo: {
    flex: 1,
  },
  selName: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-main)',
  },
  selMeta: {
    fontSize: '0.65rem',
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
  },
  menuDealCard: {
    backgroundColor: 'var(--glass)',
    borderRadius: '16px',
    border: '1px solid var(--glass-border)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  menuDotContainer: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 10,
  },
  menuDotBtn: {
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-main)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '2.2rem',
    right: '0',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    width: '110px',
    zIndex: 20,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: '0.6rem 0.8rem',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    fontWeight: '600',
    borderBottom: '1px solid var(--glass-border)',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  menuDealHeaderContainer: {
    marginBottom: '1rem',
    width: '100%',
    paddingRight: '2rem',
  },
  menuDealHeaderPatch: {
    color: 'var(--text-main)',
    fontWeight: '800',
    fontSize: '1.2rem',
    letterSpacing: '-0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  menuDealItemsArea: {
    color: 'var(--text-muted)',
    fontWeight: '500',
    fontSize: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '1rem',
    flexGrow: 1,
  },
  menuDealItemRow: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  menuDealImageContainer: {
    aspectRatio: '16/9',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '1rem',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuDealImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  menuDealPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--glass)',
  },
  menuDealPriceContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid var(--glass-border)',
  },
  menuDealPricePatch: {
    color: 'var(--primary-yellow)',
    fontWeight: '800',
    fontSize: '1.25rem',
  },
  dealUploadArea: {
    border: '2px dashed var(--glass-border)',
    borderRadius: '10px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'var(--glass)',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  dealPreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-main)',
    border: '1px solid var(--glass-border)',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  dealUploadPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  selectedItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  selectedItemThumb: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid var(--glass-border)',
  }
};

export default Deals;
