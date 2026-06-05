import { Link } from 'react-router-dom';
import { brand, footerSections } from '../../data/siteContent.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand-mark brand-mark--footer">
            <span className="brand-mark__symbol">EF</span>
            <span>{brand.name}</span>
          </Link>
          <p>{brand.tagline}. Plan task boards, collaborate in chat channels, and manage media review workflows from one clean workspace.</p>
          <div className="footer-contact">
            <span>{brand.supportEmail}</span>
            <span>{brand.phone}</span>
            <span>{brand.address}</span>
          </div>
        </div>

        {footerSections.map((section) => (
          <div className="footer-column" key={section.title}>
            <h3>{section.title}</h3>
            {section.links.map((link) => (
              <Link key={link.path + link.label} to={link.path}>{link.label}</Link>
            ))}
          </div>
        ))}
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
        <div>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/contact">Support</Link>
        </div>
      </div>
    </footer>
  );
}
