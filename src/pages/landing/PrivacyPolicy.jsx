import PageHero from '../../components/landing/PageHero.jsx';

export default function PrivacyPolicy() {
  return (
    <>
      <PageHero
        eyebrow="Privacy Policy"
        title="Your privacy matters"
        description="This privacy policy details how EditorFlow collects, safeguards, and utilizes user profile metadata and workspace information."
      />

      <section className="section-block legal-content">
        <div className="container narrow">
          <h2>1. Information we collect</h2>
          <p>We collect account profile details when signing in via Google OAuth, workspace database records, task comments, and message requests submitted through sales forms.</p>

          <h2>2. How we use information</h2>
          <p>We use information to boot workspaces, authorize editor access requests, enforce subscription levels, respond to sales leads, and secure user accounts.</p>

          <h2>3. Data security</h2>
          <p>We use reasonable administrative, technical, and database-level structural safeguards to protect workspace files and information.</p>

          <h2>4. Third-party services</h2>
          <p>Some features rely on authentication providers (Supabase Auth), hosting infrastructures, or lead management services.</p>

          <h2>5. Contact</h2>
          <p>For privacy questions, please contact support@editorflow.com.</p>
        </div>
      </section>
    </>
  );
}
