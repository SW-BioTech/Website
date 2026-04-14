import { motion } from "framer-motion";

const TEAM = [
  {
    name: "Harvey Mitchell",
    role: "Co-organiser",
    linkedin: "https://www.linkedin.com/in/harvey-mitchell-ba1681206/",
    initials: "HM",
  },
  {
    name: "Wiktor Wiejak",
    role: "Co-organiser",
    linkedin: "https://linkedin.com/in/wiktor-wiejak",
    initials: "WW",
  },
];

const card = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Team() {
  return (
    <section id="team" className="section section--team">
      <motion.div
        className="section__inner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section__title">Who we are</h2>
        <p className="section__lead">
          SW Biotech is run by two people who wanted more biotech conversation in
          the South West &mdash; so they started organising it.
        </p>

        <div className="team-grid">
          {TEAM.map((person, i) => (
            <motion.a
              key={person.name}
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="team-card glass-card"
              custom={i}
              variants={card}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-5%" }}
              whileHover={{
                y: -4,
                transition: { type: "spring", stiffness: 280, damping: 22 },
              }}
            >
              <div className="team-card__avatar">
                <span className="team-card__initials">{person.initials}</span>
              </div>
              <div className="team-card__body">
                <h3 className="team-card__name">{person.name}</h3>
                <p className="team-card__role">{person.role}</p>
                <span className="team-card__link">
                  LinkedIn &rarr;
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
