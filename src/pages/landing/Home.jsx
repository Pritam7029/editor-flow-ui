import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import CTASection from '../../components/landing/CTASection.jsx';
import TodoList from '../../components/landing/TodoList.jsx';
import SectionHeader from '../../components/landing/SectionHeader.jsx';
import {
  benefits,
  customerSegments,
  features,
  heroMetrics,
  productCards,
  stats,
  testimonials,
  trustLogos
} from '../../data/siteContent.js';

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Project software built for execution</span>
            <h1>Run every project, task, chat, and workflow from one intelligent workspace.</h1>
            <p>
              EditorFlow helps teams plan work, realign task cards, collaborate in context, automate repeated processes,
              and keep stakeholders updated without chasing scattered tools.
            </p>
            <div className="hero-actions">
              <Link className="btn btn--primary btn--large" to="/login">Open your workspace</Link>
              <Link className="btn btn--secondary btn--large" to="/features">Explore features</Link>
            </div>
            <div className="hero-metrics" aria-label="Key metrics">
              {heroMetrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="Project dashboard preview">
            <div className="dashboard-card dashboard-card--main">
              <div className="dashboard-card__top">
                <span>Launch Website</span>
                <strong>82%</strong>
              </div>
              <div className="progress-bar"><span style={{ width: '82%' }} /></div>
              <div className="task-columns">
                <div>
                  <h4>Backlog</h4>
                  <span>Wireframes</span>
                  <span>Copy review</span>
                </div>
                <div>
                  <h4>In progress</h4>
                  <span>Landing page</span>
                  <span>Pricing route</span>
                </div>
                <div>
                  <h4>Done</h4>
                  <span>Brand system</span>
                  <span>Auth flow</span>
                </div>
              </div>
            </div>
            <div className="floating-card floating-card--left">
              <CheckCircle2 size={20} />
              <span>5 tasks auto-assigned</span>
            </div>
            <div className="floating-card floating-card--right">
              <span className="avatar-stack"><i /> <i /> <i /></span>
              <span>Team synced</span>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip">
        <div className="container">
          <p>Trusted by teams building faster operating rhythms</p>
          <div className="logo-strip__items">
            {trustLogos.map((logo) => <span key={logo}>{logo}</span>)}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeader
            eyebrow="All you need to run projects"
            title="One platform for planning, collaboration, automation, and reporting"
            description="A modern, high-output structure adapted for your creative workflows: clear product blocks, trust sections, customer segments, stories, and strong conversion paths."
          />
          <div className="product-grid">
            {productCards.map((card) => {
              const Icon = card.icon;
              return (
                <article className="product-card" key={card.title}>
                  <Icon className="card-icon" size={28} />
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <Link to="/features">{card.cta} <ArrowRight size={16} /></Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="container trust-grid">
          <div className="trust-copy">
            <span className="eyebrow">Built for trust</span>
            <h2>Real visibility when delivery gets complex</h2>
            <p>
              Keep project status, responsibilities, dependencies, and decisions connected so your team always knows what
              changed, what matters, and what needs attention next.
            </p>
          </div>
          <div className="stats-grid">
            {stats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-block--muted">
        <div className="container">
          <SectionHeader
            eyebrow="Why teams choose EditorFlow"
            title="Less project noise. More accountable execution."
            description="Designed for teams that need a polished board experience, contextual collaboration, and practical automation."
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
        <div className="container split-section">
          <div>
            <span className="eyebrow">Who it serves</span>
            <h2>Built for teams that need clarity across moving work</h2>
            <p>
              Use EditorFlow as a project command center for product launches, agency delivery, operations playbooks,
              support escalations, and recurring business processes.
            </p>
          </div>
          <div className="segment-list">
            {customerSegments.map((segment) => (
              <article key={segment.title}>
                <h3>{segment.title}</h3>
                <p>{segment.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-block--muted">
        <div className="container">
          <SectionHeader
            eyebrow="Customer stories"
            title="Teams use EditorFlow to make delivery simpler"
            description="Clear workflow coordination and media review structures that align our creative goals."
          />
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.name}>
                <p>“{testimonial.quote}”</p>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <TodoList />
        </div>
      </section>
      
      <CTASection />
    </>
  );
}
