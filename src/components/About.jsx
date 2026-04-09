import useReveal from "../hooks/useReveal";

const PILLARS = [
  {
    icon: "\u25C8",
    title: "Community",
    text: "Meet people who care about translating ideas into impact.",
  },
  {
    icon: "\u25C7",
    title: "Curiosity",
    text: "Talks, meetups, and spaces where questions lead the way.",
  },
  {
    icon: "\u25CE",
    title: "Place",
    text: "Rooted in Exeter with reach across the region.",
  },
];

export default function About() {
  const titleRef = useReveal();
  const leadRef = useReveal();
  const pillarsRef = useReveal();

  return (
    <section id="about" className="section section--about">
      <div className="section__inner">
        <h2 className="section__title reveal" ref={titleRef}>
          A living network
        </h2>
        <p className="section__lead reveal" ref={leadRef}>
          From discovery science to startups and the wider ecosystem, we make
          room for conversation, shared learning, and momentum in the South
          West.
        </p>
        <ul className="pillars reveal" role="list" ref={pillarsRef}>
          {PILLARS.map(({ icon, title, text }) => (
            <li key={title} className="pillar">
              <span className="pillar__icon" aria-hidden="true">
                {icon}
              </span>
              <h3 className="pillar__title">{title}</h3>
              <p className="pillar__text">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
