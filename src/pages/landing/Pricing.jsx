import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageHero from '../../components/landing/PageHero.jsx';
import CTASection from '../../components/landing/CTASection.jsx';
import { pricingPlans } from '../../data/siteContent.js';

export default function Pricing() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Plans that scale from solo projects to enterprise operations"
        description="Start free, upgrade when your team needs more workspaces, member accounts, and media storage space."
      />

      <section className="section-block">
        <div className="container pricing-grid">
          {pricingPlans.map((plan) => {
            const isCustom = plan.name === 'Custom' || plan.name === 'Enterprise' || plan.cta.toLowerCase().includes('contact');
            const targetPath = isCustom ? '/contact' : '/login';
            return (
              <article className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`} key={plan.name}>
                {plan.popular && <span className="popular-badge">Most popular</span>}
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
                <div className="price-line">
                  <strong>{plan.price}</strong>
                  <span>{plan.cadence}</span>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}><Check size={18} /> {feature}</li>
                  ))}
                </ul>
                <Link to={targetPath} className={plan.popular ? 'btn btn--primary' : 'btn btn--secondary'}>
                  {plan.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block section-block--muted">
        <div className="container faq-grid">
          <div>
            <span className="eyebrow">Pricing questions</span>
            <h2>Simple billing for growing teams</h2>
            <p>Here are answers to the most common questions regarding plan limits, checkout flows, and payment details.</p>
          </div>
          <div className="faq-list">
            <details open>
              <summary>Can we start free?</summary>
              <p>Yes. The Free plan is designed for early-stage use, testing pipelines, and single active workspaces.</p>
            </details>
            <details>
              <summary>Can I switch between plans later?</summary>
              <p>Yes. You can upgrade to Growth at any time inside the app's onboarding drawer. Your subscription levels are managed securely on the backend.</p>
            </details>
            <details>
              <summary>Do you support custom enterprise workflows?</summary>
              <p>The Custom plan is intended for large-scale media agencies and post-production studios needing multi-TB storage space, custom seats, and dedicated priority SLAs.</p>
            </details>
          </div>
        </div>
      </section>

      <CTASection title="Start with the plan that fits your team" description="Create a free account now or contact us for an enterprise rollout discussion." />
    </>
  );
}
