import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { brand, navLinks, productCards } from '../../data/siteContent.js';
import { supabase } from '../../config/supabaseclient.js';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data && data.session) {
        setSession(data.session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="top-strip">
        <div className="container top-strip__inner">
          <span>For startups, creative studios, editing agencies, and production teams</span>
          <Link to="/contact">Talk to sales</Link>
        </div>
      </div>

      <nav className="container navbar" aria-label="Main navigation">
        <Link to="/" className="brand-mark" onClick={closeMenu} aria-label={`${brand.name} home`}>
          <span className="brand-mark__symbol">EF</span>
          <span>{brand.name}</span>
        </Link>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-panel ${open ? 'nav-panel--open' : ''}`}>
          <div className="nav-links">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions">
            {session ? (
              <Link className="btn btn--primary" to="/dashboard" onClick={closeMenu}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn--ghost" to="/login" onClick={closeMenu}>
                  Login
                </Link>
                <Link className="btn btn--primary" to="/login" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            )}
          </div>

          <div className="mega-preview" aria-label="Product overview">
            {productCards.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <Link className="mega-preview__item" to="/features" key={item.title} onClick={closeMenu}>
                  <Icon size={20} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
