import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { Spinner } from '../components/ui/spinner-1';
import { Plus, Edit2, Trash2, X, Upload, Package, MoreVertical, PlusCircle } from 'lucide-react';

const Items = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'pricing' | 'extras'
  const [showDropdown, setShowDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    priceType: 'single',
    price: '',
    variants: [],
    spiceLevel: false,
    addons: [],
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    itemId: null,
  });

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Variants handlers
  const handleAddVariant = () => {
    setFormData({ ...formData, variants: [...formData.variants, { name: '', price: '' }] });
  };
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };
  const handleRemoveVariant = (index) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  // Addons handlers
  const handleAddAddon = () => {
    setFormData({ ...formData, addons: [...formData.addons, { name: '', price: '' }] });
  };
  const handleAddonChange = (index, field, value) => {
    const newAddons = [...formData.addons];
    newAddons[index][field] = value;
    setFormData({ ...formData, addons: newAddons });
  };
  const handleRemoveAddon = (index) => {
    const newAddons = [...formData.addons];
    newAddons.splice(index, 1);
    setFormData({ ...formData, addons: newAddons });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('subCategory', formData.subCategory);
    data.append('priceType', formData.priceType);
    data.append('price', formData.price);
    data.append('spiceLevel', formData.spiceLevel);
    data.append('variants', JSON.stringify(formData.variants));
    data.append('addons', JSON.stringify(formData.addons));

    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/items/${isEditing}`, data);
      } else {
        await axios.post('http://localhost:5000/api/items', data);
      }
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving item');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', category: '', subCategory: '', priceType: 'single', 
      price: '', variants: [], spiceLevel: false, addons: [], image: null 
    });
    setImagePreview(null);
    setShowModal(false);
    setIsEditing(null);
    setActiveTab('basic');
  };

  const handleEdit = (item) => {
    setIsEditing(item._id);
    setFormData({
      name: item.name,
      category: item.category?._id || '',
      subCategory: item.subCategory || '',
      priceType: item.priceType || 'single',
      price: item.price || '',
      variants: item.variants || [],
      spiceLevel: item.spiceLevel || false,
      addons: item.addons || [],
      image: null
    });
    setImagePreview(item.image);
    setActiveTab('basic');
    setShowModal(true);
  };

  const confirmDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      itemId: id,
    });
  };

  const handleDelete = async () => {
    const id = confirmModal.itemId;
    if (!id) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting item');
    }
  };

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('All');

  // Filter items based on activeCategory and activeSubCategory
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category?.name === activeCategory;
    const matchesSubCategory = activeSubCategory === 'All' || item.subCategory === activeSubCategory;
    return matchesCategory && matchesSubCategory;
  });

  // Group filteredItems by subCategory
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      const sub = item.subCategory && item.subCategory.trim() ? item.subCategory.trim() : 'Uncategorized';
      if (!groups[sub]) {
        groups[sub] = [];
      }
      groups[sub].push(item);
    });

    // Sort keys based on activeCategory's subCategories array
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
  }, [filteredItems, activeCategory, categories]);

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.sectionTitle}>Manage Items</h2>
          <p style={styles.sectionSubtitle}>Add and organize your products.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Add New Item
        </button>
      </div>

      <div style={styles.tabsContainer}>
        <button
          onClick={() => { setActiveCategory('All'); setActiveSubCategory('All'); }}
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
            onClick={() => { setActiveCategory(cat.name); setActiveSubCategory('All'); }}
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

      {activeCategory !== 'All' && (
        (() => {
          const currentCat = categories.find(cat => cat.name === activeCategory);
          const subCats = currentCat?.subCategories || [];
          if (subCats.length === 0) return null;
          return (
            <div style={styles.subTabsContainer}>
              <button
                onClick={() => setActiveSubCategory('All')}
                style={{
                  ...styles.subTab,
                  backgroundColor: activeSubCategory === 'All' ? 'var(--primary-yellow)' : 'var(--glass)',
                  color: activeSubCategory === 'All' ? '#000' : 'var(--text-main)',
                }}
              >
                All Option
              </button>
              {subCats.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSubCategory(sub)}
                  style={{
                    ...styles.subTab,
                    backgroundColor: activeSubCategory === sub ? 'var(--primary-yellow)' : 'var(--glass)',
                    color: activeSubCategory === sub ? '#000' : 'var(--text-main)',
                  }}
                >
                  {sub.includes(' / ') ? sub.replace(' / ', ' ➔ ') : sub}
                </button>
              ))}
            </div>
          );
        })()
      )}

      <div className="items-container" style={styles.itemsContainer}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', width: '100%' }}>
            <Spinner size={40} color="var(--primary-yellow)" />
          </div>
        ) : Object.keys(groupedItems).length > 0 ? (
          Object.keys(groupedItems).map(subCat => {
            const groupItems = groupedItems[subCat];
            const showHeading = Object.keys(groupedItems).length > 1 || (subCat !== 'Uncategorized');

            return (
              <div key={subCat} style={styles.subCatSection}>
                {showHeading && (
                  <h4 style={styles.subCatHeading}>{subCat}</h4>
                )}
                <div style={styles.grid}>
                  {groupItems.map((item) => (
                    <div key={item._id} className="glass-card hover-scale" style={styles.itemCard}>
                      <div style={styles.menuDotContainer}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(showDropdown === item._id ? null : item._id);
                          }}
                          style={styles.menuDotBtn}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {showDropdown === item._id && (
                          <div style={styles.dropdownMenu}>
                            <button onClick={() => { handleEdit(item); setShowDropdown(null); }} style={styles.dropdownItem}>
                              <Edit2 size={14} style={{ marginRight: '0.4rem' }} /> Edit
                            </button>
                            <button onClick={() => { confirmDelete(item._id); setShowDropdown(null); }} style={{ ...styles.dropdownItem, color: 'var(--accent-red)' }}>
                              <Trash2 size={14} style={{ marginRight: '0.4rem' }} /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={styles.imageContainer}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={styles.itemImage} />
                        ) : (
                          <div style={styles.placeholderContainer}>
                            <Package size={32} color="var(--text-muted)" opacity={0.5} />
                          </div>
                        )}
                      </div>

                      <div style={styles.itemHeaderContainer}>
                        <div style={styles.itemName}>{item.name}</div>
                      </div>

                      <div style={styles.itemPriceContainer}>
                        {item.variants && item.variants.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Variants:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {item.variants.map((v, idx) => (
                                <span key={idx} style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  color: 'var(--text-main)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {v.name}: Rs. {v.price}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={styles.itemPrice}>Rs. {item.price}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.itemHeaderContainer}>
                <div style={styles.itemName}>{item.name}</div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  {item.spiceLevel && <span style={styles.chip}>Spicy</span>}
                  {item.addons?.length > 0 && <span style={styles.chip}>{item.addons.length} Add-ons</span>}
                </div>
              </div>

              <div style={styles.itemPriceContainer}>
                <div style={styles.itemPrice}>
                  {item.priceType === 'variants' && item.variants?.length > 0 
                    ? `From Rs. ${Math.min(...item.variants.map(v => v.price))}`
                    : `Rs. ${item.price}`
                  }
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.noItems}>
            <Package size={48} />
            <p>No items found in this category.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={resetForm} style={styles.closeBtn}><X /></button>
            </div>
            
            <div style={styles.modalTabsContainer}>
              <button 
                type="button" 
                style={activeTab === 'basic' ? styles.activeModalTab : styles.modalTab} 
                onClick={() => setActiveTab('basic')}
              >
                1. Basic Info
              </button>
              <button 
                type="button" 
                style={activeTab === 'pricing' ? styles.activeModalTab : styles.modalTab} 
                onClick={() => setActiveTab('pricing')}
              >
                2. Pricing & Portions
              </button>
              <button 
                type="button" 
                style={activeTab === 'extras' ? styles.activeModalTab : styles.modalTab} 
                onClick={() => setActiveTab('extras')}
              >
                3. Extras (Spice & Addons)
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div style={styles.formGrid}>
                  <div style={styles.formLeft}>
                    <div style={styles.formGroup}>
                      <label>Item Name</label>
                      <input 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Chicken Karahi"
                        required 
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label>Category</label>
                      <select 
                        name="category" 
                        value={formData.category} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.category && categories.find(c => c._id === formData.category)?.subCategories?.length > 0 && (
                      <div style={styles.formGroup}>
                        <label>Sub Category</label>
                        <select 
                          name="subCategory" 
                          value={formData.subCategory} 
                          onChange={handleInputChange}
                        >
                          <option value="">Select Sub Category</option>
                          {categories.find(c => c._id === formData.category).subCategories.map((sub, idx) => (
                            <option key={idx} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={styles.formRight}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>Item Image</label>
                    <div style={styles.uploadArea} onClick={() => document.getElementById('imageInput').click()}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" style={styles.previewImg} />
                      ) : (
                        <>
                          <Upload size={28} />
                          <span>Click to upload</span>
                        </>
                      )}
                      <input 
                        id="imageInput" 
                        type="file" 
                        onChange={handleImageChange} 
                        hidden 
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING */}
              {activeTab === 'pricing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '200px' }}>
                  <div style={styles.formGroup}>
                    <label>Price Type</label>
                    <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
                      <label style={styles.radioLabel}>
                        <input 
                          type="radio" 
                          name="priceType" 
                          value="single" 
                          checked={formData.priceType === 'single'} 
                          onChange={handleInputChange} 
                        />
                        Single Price (e.g. Burger)
                      </label>
                      <label style={styles.radioLabel}>
                        <input 
                          type="radio" 
                          name="priceType" 
                          value="variants" 
                          checked={formData.priceType === 'variants'} 
                          onChange={handleInputChange} 
                        />
                        Multiple Portions (e.g. Half/Full/KG)
                      </label>
                    </div>
                  </div>

                  {formData.priceType === 'single' ? (
                    <div style={styles.formGroup}>
                      <label>Item Price (Rs.)</label>
                      <input 
                        type="number" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleInputChange} 
                        placeholder="e.g. 350"
                      />
                    </div>
                  ) : (
                    <div style={{...styles.formGroup, backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                      <label>Define Portions/Variants</label>
                      {formData.variants.map((variant, index) => (
                        <div key={index} style={styles.dynamicRow}>
                          <input 
                            placeholder="Portion Name (e.g. Half)" 
                            value={variant.name} 
                            onChange={(e) => handleVariantChange(index, 'name', e.target.value)} 
                            style={{ flex: 2 }}
                            required
                          />
                          <input 
                            placeholder="Price (Rs.)" 
                            type="number" 
                            value={variant.price} 
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)} 
                            style={{ flex: 1 }}
                            required
                          />
                          <button type="button" onClick={() => handleRemoveVariant(index)} style={styles.removeBtn}><X size={18} /></button>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddVariant} style={styles.addBtn}>
                        <PlusCircle size={16} /> Add Variant
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EXTRAS */}
              {activeTab === 'extras' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '200px' }}>
                  <div style={{...styles.formGroup, backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 'bold'}}>
                      <input 
                        type="checkbox" 
                        name="spiceLevel"
                        checked={formData.spiceLevel} 
                        onChange={handleInputChange}
                        style={{width: '20px', height: '20px'}}
                      />
                      Ask for Spice Level?
                    </label>
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '2.3rem', marginTop: '4px'}}>
                      If enabled, customers will be asked to choose Mild, Normal, Spicy, or Extra Spicy.
                    </p>
                  </div>

                  <div style={{...styles.formGroup, backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                    <label>Add-ons / Extras (e.g. Raita, Extra Cheese)</label>
                    {formData.addons.map((addon, index) => (
                      <div key={index} style={styles.dynamicRow}>
                        <input 
                          placeholder="Addon Name" 
                          value={addon.name} 
                          onChange={(e) => handleAddonChange(index, 'name', e.target.value)} 
                          style={{ flex: 2 }}
                          required
                        />
                        <input 
                          placeholder="Price (Rs.)" 
                          type="number" 
                          value={addon.price} 
                          onChange={(e) => handleAddonChange(index, 'price', e.target.value)} 
                          style={{ flex: 1 }}
                          required
                        />
                        <button type="button" onClick={() => handleRemoveAddon(index)} style={styles.removeBtn}><X size={18} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddAddon} style={styles.addBtn}>
                      <PlusCircle size={16} /> Add Extra
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation / Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <div>
                  {activeTab !== 'basic' && (
                    <button 
                      type="button" 
                      onClick={() => setActiveTab(activeTab === 'extras' ? 'pricing' : 'basic')}
                      className="btn-secondary"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div>
                  {activeTab !== 'extras' ? (
                    <button 
                      type="button" 
                      onClick={() => setActiveTab(activeTab === 'basic' ? 'pricing' : 'extras')}
                      className="btn-primary"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button type="submit" className="btn-primary">
                      {isEditing ? 'Update Item' : 'Save Item'}
                    </button>
                  )}
                </div>

                {/* Variants Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '800' }}>Item Variants / Options (Optional)</h4>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      style={{ fontSize: '0.8rem', color: 'var(--primary-yellow)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>

                  {formData.variants.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                      {formData.variants.map((v, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Option Name (e.g. Chest / With Cheese)"
                            value={v.name}
                            onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                            required
                            style={{ flex: 2, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--glass)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          />
                          <input
                            type="number"
                            placeholder="Price (Rs.)"
                            value={v.price}
                            onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                            required
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--glass)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            style={{ color: 'var(--accent-red)', cursor: 'pointer', padding: '0.2rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>No variants added. Item will use the main price above.</p>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, itemId: null })}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </Layout>
  );
};

const styles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: 'var(--text-main)',
  },
  sectionSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
  },
  tabsContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  tab: {
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.8rem',
    border: '1px solid var(--glass-border)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  subTab: {
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.72rem',
    whiteSpace: 'nowrap',
    border: '1px solid var(--glass-border)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  subTabsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    marginBottom: '1.5rem',
    width: '100%',
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  subCatSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  subCatHeading: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--text-muted)',
    borderBottom: '2px solid var(--glass-border)',
    paddingBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
  },
  itemCard: {
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
  imageContainer: {
    aspectRatio: '16/9',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '1rem',
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--glass)',
  },
  itemCategoryBadge: {
    position: 'absolute',
    top: '0.5rem',
    left: '0.5rem',
    padding: '0.3rem 0.7rem',
    backgroundColor: 'var(--primary-yellow)',
    color: '#000',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '800',
  },
  itemHeaderContainer: {
    marginBottom: '1rem',
    width: '100%',
  },
  itemName: {
    color: 'var(--text-main)',
    fontWeight: '600',
    fontSize: '1rem',
    letterSpacing: '-0.5px',
    lineHeight: '1.2',
    wordBreak: 'break-word',
  },
  itemPriceContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '1px solid var(--glass-border)',
  },
  itemPrice: {
    color: 'var(--primary-yellow)',
    fontWeight: '800',
    fontSize: '1.25rem',
  },
  noItems: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem',
    color: 'var(--text-muted)',
    gap: '1rem',
  },
  chip: {
    padding: '2px 8px',
    backgroundColor: 'var(--glass-border)',
    borderRadius: '12px',
    fontSize: '0.7rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '720px',
    padding: '1.75rem',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    color: 'var(--text-main)',
  },
  modalTabsContainer: {
    display: 'flex',
    borderBottom: '1px solid var(--glass-border)',
    marginBottom: '1.5rem',
    gap: '1rem'
  },
  modalTab: {
    padding: '0.8rem 0',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontWeight: '600',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  activeModalTab: {
    padding: '0.8rem 0',
    background: 'none',
    border: 'none',
    color: 'var(--primary-yellow)',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderBottom: '2px solid var(--primary-yellow)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '1.5rem',
    minHeight: '200px'
  },
  formLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  formRight: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    color: 'var(--text-muted)',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: 'var(--text-main)',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  dynamicRow: {
    display: 'flex',
    gap: '0.8rem',
    alignItems: 'center',
    marginTop: '0.8rem'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-red)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: '4px'
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'none',
    border: '1px dashed var(--glass-border)',
    color: 'var(--text-main)',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '1rem',
    width: 'fit-content',
    fontSize: '0.85rem'
  },
  uploadArea: {
    flex: 1,
    border: '2px dashed var(--glass-border)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.3s ease',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    minHeight: '140px',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  closeBtn: { color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }
};

export default Items;
