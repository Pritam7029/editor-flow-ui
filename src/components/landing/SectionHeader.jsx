export default function SectionHeader({ eyebrow, title, description, align = 'center' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
