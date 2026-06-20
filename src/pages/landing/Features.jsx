import PageHero from '../../components/landing/PageHero.jsx';
import SectionHeader from '../../components/landing/SectionHeader.jsx';
import CTASection from '../../components/landing/CTASection.jsx';
import { benefits, features, securityHighlights } from '../../data/siteContent.js';

export default function Features() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything your team needs to plan, discuss, execute, and report"
        description="A complete project operating layer with task boards, contextual chat, smart task creation, review approvals, analytics, and secure collaboration."
      >
        <div className="hero-mini-panel">
          <strong>Feature coverage</strong>
          <span>Boards • Chat • Tasks • Reviews • Analytics</span>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="container feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-card" key={feature.title}>
                <Icon size={28} />
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block section-block--muted">
        <div className="container">
          <SectionHeader
            eyebrow="Platform advantages"
            title="A workspace that adapts to your process"
            description="Use flexible views, permissions, and automations to support different teams without fragmenting project context."
          />
          <div className="benefit-grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article className="benefit-card" key={benefit.title}>
                  <Icon size={24} />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container security-row">
          {securityHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={24} />
                <span>{item.title}</span>
              </article>
            );
          })}
        </div>
      </section>

      <CTASection title="Give your project workflow a cleaner front door" description="Launch with a high-converting marketing site and connect it to your existing React product." />
    </>
  );
}
