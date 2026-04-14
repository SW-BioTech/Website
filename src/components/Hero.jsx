import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  return (
    <section className="hero">
      <motion.div
        className="hero__grid"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="hero__copy">
          <motion.p className="hero__eyebrow" variants={fadeUp}>
            Exeter &middot; South West England
          </motion.p>
          <motion.h1 className="hero__title" variants={fadeUp}>
            Where biology meets{" "}
            <span className="hero__title-accent">collaboration</span>
          </motion.h1>
          <motion.p className="hero__lede" variants={fadeUp}>
            South West Biotech is a growing cluster for founders, researchers,
            clinicians, and curious minds. We host gatherings that spark
            connections across life sciences and technology.
          </motion.p>
          <motion.div className="hero__actions" variants={fadeUp}>
            <a className="btn btn--primary btn--ripple" href="#newsletter">
              Subscribe for updates
            </a>
            <a className="btn btn--ghost" href="#events">
              Upcoming events
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
