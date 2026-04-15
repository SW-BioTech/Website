import { motion } from "framer-motion";

const PARTNERS = [
  {
    name: "Exeter Innovation",
    url: "https://news.exeter.ac.uk/category/research/exeter-innovation/",
    logo: "./images/partners/exeter-innovation.png",
  },
  {
    name: "NIHR HealthTech Research Centre in Sustainable Innovation",
    url: "https://hrc-sustainable.nihr.ac.uk/",
    logo: "./images/partners/nihr.png",
  },
  {
    name: "Tech South West",
    url: "https://techsouthwest.co.uk/",
    logo: "./images/partners/tech-south-west.png",
  },
];

export default function Partners() {
  return (
    <section id="partners" className="section section--partners">
      <motion.div
        className="section__inner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="section__title">Partners</h2>

        <div className="partners-grid">
          {PARTNERS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-logo-card"
            >
              <img
                src={p.logo}
                alt={p.name}
                className="partner-logo-card__img"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
