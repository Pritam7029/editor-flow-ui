import PageHero from '../../components/landing/PageHero.jsx';
import CTASection from '../../components/landing/CTASection.jsx';

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="We are building a calmer way for teams to manage complex work"
        description="EditorFlow is designed around one principle: project software should reduce coordination load, not create more of it."
      />

      <section className="section-block">
        <div className="container story-grid">
          <div>
            <span className="eyebrow">Our story</span>
            <h2>From scattered tools to one project operating system</h2>
          </div>
          <div className="story-copy">
            <p>
              Modern creative teams often split work across drives, chats, boards, spreadsheets, emails, and status calls. EditorFlow brings
              those moving pieces into one connected interface so teams can preserve context while moving faster.
            </p>
            <p>
              The product focuses on practical creative execution: realignable Kanban cards, clean task creation, visible editor ownership, contextual
              discussions, and media review approvals that do not require manual status chasing.
            </p>
          </div>
        </div>
      </section>

      <section className="section-block section-block--muted">
        <div className="container values-grid">
          <article>
            <h3>Clarity first</h3>
            <p>Every screen should make the next editing or review action obvious.</p>
          </article>
          <article>
            <h3>Context stays attached</h3>
            <p>Decisions, files, comments, and review timestamps live beside the cards they affect.</p>
          </article>
          <article>
            <h3>Automation with control</h3>
            <p>Teams can automate repetitive coordination without losing accountability or client alignment.</p>
          </article>
        </div>
      </section>

      <CTASection title="Help your team work with more focus" description="Bring your workflows, tasks, and conversations into a single workspace." />
    </>
  );
}
