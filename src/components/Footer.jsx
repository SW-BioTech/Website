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
        <img
          src="./images/brand/sw-biotech-lockup-light.png"
          alt="SW Biotech — Southwest Network"
          className="site-footer__logo"
          width="220"
          height="220"
        />
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
