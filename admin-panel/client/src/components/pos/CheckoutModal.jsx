import React from 'react';
import { X, Printer } from 'lucide-react';

const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  total, 
  cashReceived, 
  setCashReceived, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  const changeToReturn = cashReceived ? (Number(cashReceived) - total) : 0;
  const isSufficient = changeToReturn >= 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
      <div className="glass-card" style={{ width: '380px', padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Cash & Checkout</h2>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}>
            <X size={20} />
          </button>
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
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
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
          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: isSufficient ? '#4ade80' : '#ef4444' }}>
            Rs. {cashReceived ? changeToReturn.toFixed(0) : '0'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '0.8rem', backgroundColor: 'var(--primary-yellow)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
