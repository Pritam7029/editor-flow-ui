import { Link } from 'react-router-dom';

export default function CTASection({ 
  title = 'Ready to build a calmer project operating system?', 
  description = 'Create your workspace, invite your team, and start shipping with clearer ownership today.' 
}) {
  return (
    <section className="cta-band">
      <div className="container cta-band__inner">
        <div>
          <span className="eyebrow eyebrow--light">Start today</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="cta-band__actions">
          <Link className="btn btn--light" to="/login">Sign up free</Link>
          <Link className="btn btn--outline-light" to="/contact">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
