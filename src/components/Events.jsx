import { motion } from "framer-motion";

const UPCOMING = {
  title: "Biotech in the South West: Panel Discussion",
  date: "Early June 2026",
  venue: "Exeter · Venue TBC",
  description:
    "A panel event exploring the future of biotech in the region. Confirmed panellists include representatives from Innovate UK and SETsquared. More speakers and details coming soon.",
};

const PAST_EVENTS = [
  {
    title: "Discovering South West Biotech",
    date: "25 Feb 2026",
    venue: "Exeter Innovation Hub",
    attendees: 34,
    description:
      "Our inaugural meetup bringing together researchers, founders, and biotech-curious minds from across the South West for an evening of talks and networking.",
    url: "https://www.eventbrite.co.uk/e/discovering-south-west-biotech-tickets-1980147469385",
    image: "./images/events/discovering-crowd.jpg",
    imageAlt: "Audience at Discovering South West Biotech event",
  },
  {
    title: "Science to Startup: Into Biotech Entrepreneurship",
    date: "25 Mar 2026",
    venue: "XFi Building, Exeter",
    attendees: 28,
    description:
      "A deep-dive into turning research into ventures — covering funding, IP, and the journey from lab bench to biotech company.",
    url: "https://www.eventbrite.co.uk/e/science-to-startup-into-biotech-entrepreneurship-tickets-1983945836403",
    image: "./images/events/startup-talk.jpg",
    imageAlt: "Speaker presenting at Science to Startup event",
  },
];

const card = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Events() {
  return (
    <section id="events" className="section section--events">
      <motion.div
        className="section__inner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section__title">Events</h2>
        <p className="section__lead">
          We organise meetups across Exeter for people in and around biotech.
          Subscribe to our newsletter to hear about upcoming events first.
        </p>

        {/* Upcoming event banner */}
        <motion.div
          className="upcoming-card glass-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5%" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="upcoming-card__badge">Up next</span>
          <h3 className="upcoming-card__title">{UPCOMING.title}</h3>
          <p className="upcoming-card__meta">
            {UPCOMING.date} &middot; {UPCOMING.venue}
          </p>
          <p className="upcoming-card__desc">{UPCOMING.description}</p>
          <a className="btn btn--primary btn--ripple" href="#newsletter">
            Subscribe for updates
          </a>
        </motion.div>

        {/* Past events */}
        <h3 className="events-sub-heading">Past events</h3>
        <div className="events-grid">
          {PAST_EVENTS.map((evt, i) => (
            <motion.a
              key={evt.url}
              href={evt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-card glass-card"
              custom={i}
              variants={card}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-5%" }}
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 260, damping: 20 },
              }}
            >
              <div className="event-card__img-wrap">
                <img
                  src={evt.image}
                  alt={evt.imageAlt}
                  className="event-card__img"
                  loading="lazy"
                />
                <span className="event-card__badge">Past event</span>
              </div>
              <div className="event-card__body">
                <p className="event-card__date">
                  {evt.date} &middot; {evt.venue}
                </p>
                <h3 className="event-card__title">{evt.title}</h3>
                <p className="event-card__desc">{evt.description}</p>
                {evt.attendees && (
                  <p className="event-card__stat">
                    {evt.attendees} attendees
                  </p>
                )}
                <span className="event-card__link">
                  View on Eventbrite &rarr;
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
