import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const PAST_EVENTS = [
  {
    title: "Discovering South West Biotech",
    date: "25 Feb 2026",
    venue: "Exeter Innovation Hub",
    attendees: 34,
    description:
      "Our inaugural meetup bringing together researchers, founders, and biotech-curious minds from across the South West for an evening of talks and networking.",
    url: "https://www.eventbrite.co.uk/e/discovering-south-west-biotech-tickets-1980147469385",
    linkLabel: "View on Eventbrite",
    images: [
      {
        src: "./images/events/discovering-crowd.jpg",
        alt: "Audience at Discovering South West Biotech event",
      },
    ],
  },
  {
    title: "Science to Startup: Into Biotech Entrepreneurship",
    date: "25 Mar 2026",
    venue: "XFi Building, Exeter",
    attendees: 28,
    description:
      "A deep-dive into turning research into ventures — covering funding, IP, and the journey from lab bench to biotech company.",
    url: "https://www.eventbrite.co.uk/e/science-to-startup-into-biotech-entrepreneurship-tickets-1983945836403",
    linkLabel: "View on Eventbrite",
    images: [
      {
        src: "./images/events/startup-march.jpg",
        alt: "Science to Startup event at XFi Building, Exeter",
      },
    ],
  },
  {
    title: "Biotech in the South West: Panel Discussion",
    date: "19 Jun 2026",
    venue: "Living Systems Institute, Exeter",
    attendees: 52,
    description:
      "A panel event exploring the future of biotech in the region, with panellists from ARIA, QantX, the University of Exeter and SETsquared taking questions from a capacity audience.",
    url: "https://luma.com/event/evt-SC2Df8F54eVpuE5",
    linkLabel: "View on Luma",
    images: [
      {
        src: "./images/upcoming-event.png",
        alt: "State of South West Deeptech: Idea to Product — panel event poster",
      },
      {
        src: "./images/events/panel-june.jpeg",
        alt: "Panellists on stage at the Living Systems Institute, Exeter",
      },
    ],
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

/* Delay before a multi-photo card advances to its second photo, once seen. */
const AUTO_ADVANCE_MS = 1000;

function EventPhotos({ images }) {
  const [index, setIndex] = useState(0);
  const [userPicked, setUserPicked] = useState(false);
  const wrapRef = useRef(null);

  // Once the card scrolls into view, roll to the newer photo after a beat.
  // A manual pick cancels this for good — we never yank the photo back.
  useEffect(() => {
    if (images.length < 2 || userPicked) return;
    const el = wrapRef.current;
    if (!el) return;

    let timer;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          timer = setTimeout(() => setIndex(1), AUTO_ADVANCE_MS);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [images.length, userPicked]);

  const pick = (event, i) => {
    // The whole card is a link — a dot press must not follow it.
    event.preventDefault();
    event.stopPropagation();
    setUserPicked(true);
    setIndex(i);
  };

  return (
    <div className="event-card__img-wrap" ref={wrapRef}>
      {images.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          className={`event-card__img${i === index ? " is-active" : ""}`}
          loading="lazy"
          aria-hidden={i !== index}
        />
      ))}
      <span className="event-card__badge">Past event</span>
      {images.length > 1 && (
        <span className="event-card__dots">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className={`event-card__dot${i === index ? " is-active" : ""}`}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === index}
              onClick={(event) => pick(event, i)}
            />
          ))}
        </span>
      )}
    </div>
  );
}

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
              <EventPhotos images={evt.images} />
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
                  {evt.linkLabel} &rarr;
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
