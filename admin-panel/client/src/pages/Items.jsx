import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { Spinner } from '../components/ui/spinner-1';
import { Plus, Edit2, Trash2, X, Upload, Package, MoreVertical } from 'lucide-react';

const Items = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    price: '',
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('subCategory', formData.subCategory);
    data.append('price', formData.price);
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
    setFormData({ name: '', category: '', subCategory: '', price: '', image: null });
    setImagePreview(null);
    setShowModal(false);
    setIsEditing(null);
  };

  const handleEdit = (item) => {
    setIsEditing(item._id);
    setFormData({
      name: item.name,
      category: item.category?._id || '',
      subCategory: item.subCategory || '',
      price: item.price,
      image: null
    });
    setImagePreview(item.image);
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
    
    console.log('handleDelete clicked for ID:', id);
    try {
      const response = await axios.delete(`http://localhost:5000/api/items/${id}`);
      console.log('Delete response from server:', response.data);
      fetchData();
    } catch (err) {
      console.error('DELETE ITEM CLIENT ERROR:', err);
      alert(err.response?.data?.message || 'Error deleting item');
    }
  };

  const [activeCategory, setActiveCategory] = useState('All');

  // Filter items based on activeCategory
  const filteredItems = items.filter(item => 
    activeCategory === 'All' || item.category?.name === activeCategory
  );

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

      <div style={styles.grid}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', width: '100%' }}>
            <Spinner size={40} color="var(--primary-yellow)" />
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
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
                      <Edit2 size={14} style={{ marginRight: '0.4rem' }}/> Edit
                    </button>
                    <button onClick={() => { confirmDelete(item._id); setShowDropdown(null); }} style={{...styles.dropdownItem, color: 'var(--accent-red)'}}>
                      <Trash2 size={14} style={{ marginRight: '0.4rem' }}/> Delete
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
                <div style={styles.itemCategoryBadge}>
                  {item.category?.name || 'No Category'}
                  {item.subCategory && <span style={{ opacity: 0.8, fontWeight: 'normal', marginLeft: '4px' }}>| {item.subCategory}</span>}
                </div>
              </div>

              <div style={styles.itemHeaderContainer}>
                <div style={styles.itemName}>{item.name}</div>
              </div>

              <div style={styles.itemPriceContainer}>
                <div style={styles.itemPrice}>Rs. {item.price}</div>
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
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                {/* Left Column: Fields */}
                <div style={styles.formLeft}>
                  <div style={styles.formGroup}>
                    <label>Item Name</label>
                    <input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Chicken Burger"
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

                  <div style={styles.formGroup}>
                    <label>Price (Rs.)</label>
                    <input 
                      type="number" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleInputChange} 
                      placeholder="e.g. 350"
                      required 
                    />
                  </div>
                </div>

                {/* Right Column: Image */}
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

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
                {isEditing ? 'Update Item' : 'Create Item'}
              </button>
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
    marginBottom: '2.5rem',
  },
  sectionTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--text-main)',
  },
  sectionSubtitle: {
    color: 'var(--text-muted)',
  },
  tabsContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2.5rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  tab: {
    padding: '0.6rem 1.5rem',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '0.9rem',
    border: '1px solid var(--glass-border)',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
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
    backgroundColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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
    paddingRight: '2rem',
  },
  itemName: {
    color: 'var(--text-main)',
    fontWeight: '800',
    fontSize: '1.2rem',
    letterSpacing: '-0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    color: 'var(--text-main)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    color: 'var(--text-muted)',
  },
  select: {},
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
  closeBtn: { color: 'var(--text-muted)' }
};

export default Items;
