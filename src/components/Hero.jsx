import useReveal from "../hooks/useReveal";
import DnaHelix from "./DnaHelix";

export default function Hero() {
  const copyRef = useReveal();
  const visualRef = useReveal();

  return (
    <section className="hero">
      <div className="hero__grid">
        <div className="hero__copy reveal" ref={copyRef}>
          <p className="hero__eyebrow">Exeter &middot; South West England</p>
          <h1 className="hero__title">
            Where biology meets{" "}
            <span className="hero__title-accent">collaboration</span>
          </h1>
          <p className="hero__lede">
            South West Biotech is a growing cluster for founders, researchers,
            clinicians, and curious minds. We host gatherings that spark
            connections across life sciences and technology.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#newsletter">
              Subscribe for updates
            </a>
            <a className="btn btn--ghost" href="#events">
              Upcoming events
            </a>
          </div>
        </div>

        <div
          className="hero__visual reveal reveal--delay"
          ref={visualRef}
          aria-hidden="true"
        >
          <DnaHelix />
          <div className="hero__orb" />
        </div>
      </div>
    </section>
  );
}
