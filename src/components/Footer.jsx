import { motion } from "framer-motion";

const EVENTBRITE_URL = "#events";

export default function Footer() {
  return (
    <motion.footer
      className="site-footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="site-footer__inner">
        <p className="site-footer__brand">South West Biotech</p>
        <p className="site-footer__tag">Biotech cluster &middot; Exeter</p>
        <div className="site-footer__links">
          <a href={EVENTBRITE_URL}>Events</a>
          <a href="#contact">Contact</a>
        </div>
        <p className="site-footer__legal">
          &copy; {new Date().getFullYear()} South West Biotech. All rights
          reserved.
        </p>
      </div>
    </motion.footer>
  );
}
