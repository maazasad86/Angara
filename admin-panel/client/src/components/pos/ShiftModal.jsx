import React from 'react';
import { X } from 'lucide-react';

const ShiftModal = ({
  isOpen,
  onClose,
  shiftData,
  drawerCashInput,
  setDrawerCashInput,
  onSubmit
}) => {
  if (!isOpen || !shiftData) return null;

  const systemCash = shiftData.systemCash;
  const inputCash = Number(drawerCashInput);
  const diff = inputCash - systemCash;
  const isExact = diff === 0;
  const isExcess = diff > 0;
  
  let statusColor = '#ef4444'; // default red for shortage
  if (isExact) statusColor = '#a3e635';
  else if (isExcess) statusColor = '#facc15';

  let statusText = `Shortage: Rs. ${Math.abs(diff)}`;
  if (isExact) statusText = 'Exact Match';
  else if (isExcess) statusText = `Excess: Rs. ${diff}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
      <div className="glass-card" style={{ width: '380px', padding: '1.5rem', animation: 'scaleIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Close Shift (Z-Report)</h2>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}>
            <X size={20} />
          </button>
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
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: statusColor }}>
              {statusText}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Cancel
          </button>
          <button onClick={onSubmit} style={{ flex: 2, padding: '0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Close & Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
