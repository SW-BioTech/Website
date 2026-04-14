import { useState, useEffect, useRef } from "react";

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);

export default function Mascot() {
  const [visible, setVisible] = useState(true);
  const [label] = useState(() =>
    isTouchDevice() ? "Tap the background!" : "Hover the background!"
  );
  const timerRef = useRef(null);
  const wasAwayRef = useRef(false);

  useEffect(() => {
    const scheduleHide = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    };

    scheduleHide();

    const onScroll = () => {
      if (window.scrollY > 200) {
        wasAwayRef.current = true;
        return;
      }
      if (wasAwayRef.current && window.scrollY <= 50) {
        wasAwayRef.current = false;
        setVisible(true);
        scheduleHide();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className={`mascot ${visible ? "mascot--visible" : ""}`} aria-hidden="true">
      <div className="mascot__panel">
        <img
          className="mascot__img"
          src="/images/mascot.webp"
          alt=""
          width="52"
          height="52"
        />
        <span className="mascot__label">{label}</span>
      </div>
    </div>
  );
}
