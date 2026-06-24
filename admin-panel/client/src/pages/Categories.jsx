import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories');
      setCategories(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/categories', { name, description });
      setName('');
      setDescription('');
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`http://localhost:5000/api/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert('Error deleting category');
      }
    }
  };

  const handleEdit = (category) => {
    setIsEditing(category._id);
    setEditName(category.name);
    setEditDescription(category.description);
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/categories/${id}`, { 
        name: editName, 
        description: editDescription 
      });
      setIsEditing(null);
      fetchCategories();
    } catch (err) {
      alert('Error updating category');
    }
  };

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.sectionTitle}>Product Categories</h2>
          <p style={styles.sectionSubtitle}>Manage your store categories here.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="glass-card" style={styles.tableCard}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading categories...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>NAME</th>
                <th style={styles.th}>DESCRIPTION</th>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} style={styles.tr}>
                  <td style={styles.td}>
                    {isEditing === cat._id ? (
                      <input 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        style={styles.inlineInput}
                      />
                    ) : (
                      <span style={styles.catName}>{cat.name}</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {isEditing === cat._id ? (
                      <input 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)}
                        style={styles.inlineInput}
                      />
                    ) : (
                      cat.description || '-'
                    )}
                  </td>
                  <td style={styles.td}>
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      {isEditing === cat._id ? (
                        <>
                          <button onClick={() => handleUpdate(cat._id)} style={styles.actionBtnCheck}>
                            <Check size={18} />
                          </button>
                          <button onClick={() => setIsEditing(null)} style={styles.actionBtnCancel}>
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(cat)} style={styles.actionBtnEdit}>
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(cat._id)} style={styles.actionBtnDelete}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Add New Category</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}><X /></button>
            </div>
            <form onSubmit={handleAdd} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electronics"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more about this category"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const styles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  sectionSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  tableCard: {
    padding: '1rem',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '1rem',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: '700',
    letterSpacing: '1px',
    borderBottom: '1px solid var(--glass-border)',
  },
  tr: {
    borderBottom: '1px solid var(--glass-border)',
  },
  td: {
    padding: '1.25rem 1rem',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
  },
  catName: {
    fontWeight: '600',
    color: 'var(--primary-yellow)',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
  },
  actionBtnEdit: {
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  actionBtnDelete: {
    color: 'var(--accent-red)',
    cursor: 'pointer',
  },
  actionBtnCheck: {
    color: '#4ade80',
    cursor: 'pointer',
  },
  actionBtnCancel: {
    color: 'var(--accent-red)',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    width: '90%',
    maxWidth: '500px',
    padding: '2.5rem',
    backgroundColor: 'var(--bg-card)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    color: 'var(--text-main)',
  },
  closeBtn: {
    color: 'var(--text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  inlineInput: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--primary-yellow)',
    backgroundColor: 'var(--glass)',
    color: 'var(--text-main)',
  }
};

export default Categories;
