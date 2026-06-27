import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Spinner } from '../components/ui/spinner-1';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit2, Trash2, X, Check, FileText } from 'lucide-react';

const ExpenseFormModal = ({ onClose, onSave, initialData }) => {
  const [amount, setAmount] = useState(initialData ? initialData.amount : '');
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave({ amount: Number(amount), description });
    setIsSubmitting(false);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {initialData ? 'Edit Expense' : 'Add Expense'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Record daily expenses for your restaurant
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} className="hover-scale"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (Rs.)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              required
              autoFocus
              style={styles.inputField}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bought vegetables"
              required
              style={{...styles.inputField, minHeight: '80px', resize: 'vertical'}}
            />
          </div>
          <div style={styles.formActions}>
            <button type="button" onClick={onClose} className="btn-secondary" style={styles.cancelBtn}>Cancel</button>
            <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:5000/api/expenses`);
      setExpenses(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingExpense) {
        await axios.put(`http://${window.location.hostname}:5000/api/expenses/${editingExpense._id}`, data);
      } else {
        await axios.post(`http://${window.location.hostname}:5000/api/expenses`, data);
      }
      setShowModal(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Error saving expense');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://${window.location.hostname}:5000/api/expenses/${deleteId}`);
      setShowDeleteConfirm(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Error deleting expense');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
          <Spinner size={50} color="var(--primary-yellow)" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fade-in">
        <div style={styles.header}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Expenses</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage daily restaurant expenses</p>
          </div>
          <button 
            className="btn-primary" 
            style={styles.headerBtn}
            onClick={() => { setEditingExpense(null); setShowModal(true); }}
          >
            <Plus size={20} /> Add Expense
          </button>
        </div>

        <div className="glass-card" style={styles.card}>
          {expenses.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={48} />
              <p>No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense._id}>
                      <td>{formatDate(expense.createdAt)}</td>
                      <td>
                        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{expense.description}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-red)' }}>
                        Rs. {expense.amount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="icon-btn edit-btn" 
                            onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="icon-btn delete-btn" 
                            onClick={() => handleDeleteClick(expense._id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseFormModal 
          onClose={() => setShowModal(false)} 
          onSave={handleSave} 
          initialData={editingExpense} 
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Expense"
          message="Are you sure you want to delete this expense? This action cannot be undone."
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          type="danger"
        />
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
  headerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
  },
  card: {
    padding: '1.5rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    color: 'var(--text-muted)',
    gap: '1rem',
    opacity: 0.7,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid var(--glass-border)',
    animation: 'scaleIn 0.2s ease-out'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.4rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  inputField: {
    padding: '0.9rem',
    backgroundColor: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    fontSize: '1rem',
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.9rem',
    fontSize: '1rem',
  },
  submitBtn: {
    flex: 1,
    padding: '0.9rem',
    fontSize: '1rem',
  }
};

export default Expenses;
