export default function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="page-hero">
      <div className="container page-hero__inner">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children && <div className="page-hero__aside">{children}</div>}
      </div>
    </section>
  );
}
