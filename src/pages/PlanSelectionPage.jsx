import { useState } from 'react';
import { selectFreePlan, createWorkspace, contactSales } from '../services/workspaceApi';

export default function PlanSelectionPage({ session, onPlanSelected }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Custom plan contact form state
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState(session.user.user_metadata?.name || '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [salesSuccess, setSalesSuccess] = useState(false);

  const handleSelectFree = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Choose Free Plan
      await selectFreePlan();
      
      // 2. Automatically create first workspace
      await createWorkspace('My Workspace');
      
      // 3. Callback to trigger bootstrap refresh & redirect
      onPlanSelected();
    } catch (err) {
      console.error('Failed to select Free plan:', err);
      setError(err.message || 'Failed to select Free plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalesSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await contactSales({
        companyName,
        contactName,
        email: session.user.email,
        phone,
        message
      });
      setSalesSuccess(true);
    } catch (err) {
      console.error('Sales submission failed:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)', color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>✦</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Select Your Plan</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>To begin building your team workspace, choose the plan that best fits your workflow.</p>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '2rem', padding: '0.75rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '0.95rem', border: '1px solid rgba(239, 68, 68, 0.2)', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '900px', width: '100%', alignItems: 'stretch' }}>
        
        {/* Free Plan */}
        <div style={{ background: 'var(--bg-card)', padding: '2.5rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Free</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Perfect for testing and personal side projects.</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              $0 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ month</span>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li>1 Workspace</li>
              <li>Up to 4 active members</li>
              <li>2 GB cloud media storage</li>
              <li>Standard tasks & board</li>
              <li>Persistent team chat</li>
            </ul>
          </div>
          <button 
            onClick={handleSelectFree}
            disabled={loading}
            className="primary-button" 
            style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}
          >
            {loading ? 'Initializing...' : 'Select Free Plan'}
          </button>
        </div>

        {/* Growth Plan */}
        <div style={{ background: 'var(--bg-card)', padding: '2.5rem 1.5rem', borderRadius: '16px', border: '2px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Growth</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>For active video editors and production houses.</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              $25 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ month</span>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li>5 Active Workspaces</li>
              <li>Up to 20 active members</li>
              <li>1 TB cloud media storage</li>
              <li>Instant join invite links</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px' }}>Payment Integration Coming Soon</div>
            <button 
              disabled
              className="ghost-button" 
              style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', cursor: 'not-allowed', opacity: 0.6 }}
            >
              Select Growth
            </button>
          </div>
        </div>

        {/* Custom Plan */}
        <div style={{ background: 'var(--bg-card)', padding: '2.5rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Custom</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>For enterprise operations and networks.</p>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              Contact Us
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <li>Unlimited Workspaces</li>
              <li>Custom seat limits</li>
              <li>Dedicated server storage</li>
              <li>SLA and custom integration</li>
              <li>Admin portal tools</li>
            </ul>
          </div>
          <button 
            onClick={() => { setShowSalesForm(true); setSalesSuccess(false); }}
            className="ghost-button" 
            style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}
          >
            Contact Sales
          </button>
        </div>

      </div>

      {/* Sales Lead Form Modal */}
      {showSalesForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Contact Sales</h3>
              <button 
                onClick={() => setShowSalesForm(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {salesSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Request Submitted!</h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Our sales team will review your requirements and reach out to you shortly.</p>
                <button 
                  onClick={() => setShowSalesForm(false)} 
                  className="primary-button" 
                  style={{ padding: '0.5rem 2rem' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSalesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    className="text-input" 
                    placeholder="Acme Corp" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Name</label>
                  <input 
                    type="text" 
                    required 
                    value={contactName} 
                    onChange={(e) => setContactName(e.target.value)} 
                    className="text-input" 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Phone</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="text-input" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Message / Requirements</label>
                  <textarea 
                    rows={4} 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    className="text-input" 
                    placeholder="Tell us about your team size, expected editors, and storage needs..." 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="primary-button" 
                  style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold', marginTop: '8px' }}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
