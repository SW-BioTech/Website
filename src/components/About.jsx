import { useState, useCallback } from "react";
import { motion } from "framer-motion";

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
  const [activeSignals, setActiveSignals] = useState(new Set());

  const triggerCascade = useCallback((startIndex) => {
    const order = [
      startIndex,
      (startIndex + 1) % 3,
      (startIndex + 2) % 3,
    ];
    order.forEach((idx, step) => {
      setTimeout(() => {
        setActiveSignals((prev) => new Set([...prev, idx]));
        setTimeout(() => {
          setActiveSignals((prev) => {
            const next = new Set(prev);
            next.delete(idx);
            return next;
          });
        }, 600);
      }, step * 250);
    });
  }, []);

  return (
    <section id="about" className="section section--about">
      <div className="section__inner">
        <motion.h2
          className="section__title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          A living network
        </motion.h2>
        <motion.p
          className="section__lead"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          From discovery science to startups and the wider ecosystem, we make
          room for conversation, shared learning, and momentum in the South
          West.
        </motion.p>

        <ul className="pillars" role="list">
          {PILLARS.map(({ icon, title, text }, i) => (
            <motion.li
              key={title}
              className={`pillar glass-card${activeSignals.has(i) ? " pillar--signal" : ""}`}
              onClick={() => triggerCascade(i)}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{
                duration: 0.65,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                y: -6,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
            >
              <span className="pillar__icon" aria-hidden="true">
                {icon}
              </span>
              <h3 className="pillar__title">{title}</h3>
              <p className="pillar__text">{text}</p>
            </motion.li>
          ))}
        </ul>
        <p className="cascade-hint">Click a card to trigger a signal cascade</p>
      </div>
    </section>
  );
}
