import { useState, useEffect } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import PageHero from '../../components/landing/PageHero.jsx';
import { brand } from '../../data/siteContent.js';
import { contactSales } from '../../services/workspaceApi.js';
import { supabase } from '../../config/supabaseclient.js';

export default function Contact() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Sync profile details if session is loaded
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data && data.session && data.session.user) {
        const user = data.session.user;
        if (user.user_metadata && user.user_metadata.name) {
          setContactName(user.user_metadata.name);
        }
        if (user.email) {
          setEmail(user.email);
        }
      }
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await contactSales({
        companyName,
        contactName,
        email,
        phone,
        message
      });
      setSuccess(true);
      // Reset form
      setCompanyName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      console.error('Contact sales submission failed:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="Let’s talk about your project workflow"
        description="Ask about implementation, pricing, onboarding, custom workspace capacities, or request a product walkthrough."
      />

      <section className="section-block">
        <div className="container contact-grid">
          <div className="contact-card">
            <h2>Reach us directly</h2>
            <p>Our sales and support teams are available to help align your post-production pipeline.</p>
            <div className="contact-method"><Mail size={20} /> <span>{brand.supportEmail}</span></div>
            <div className="contact-method"><Phone size={20} /> <span>{brand.phone}</span></div>
            <div className="contact-method"><MapPin size={20} /> <span>{brand.address}</span></div>
          </div>

          {success ? (
            <div className="contact-form" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
              <h3>Request Submitted!</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
                Our team has received your details and will get back to you within 24 hours.
              </p>
              <button className="btn btn--primary" onClick={() => setSuccess(false)}>
                Submit another message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              {error && (
                <div style={{ color: 'var(--rose)', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  {error}
                </div>
              )}
              <label>
                Contact Name *
                <input 
                  required 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name" 
                />
              </label>
              <label>
                Company Name *
                <input 
                  required 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp" 
                />
              </label>
              <label>
                Work Email *
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" 
                />
              </label>
              <label>
                Phone Number
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000" 
                />
              </label>
              <label>
                Message *
                <textarea 
                  required 
                  rows="4" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your team size, expected workspaces, and storage needs..." 
                />
              </label>
              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
