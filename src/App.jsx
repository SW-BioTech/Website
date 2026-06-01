import { lazy, Suspense, useState } from "react";
import Header from "./components/Header";
import NeuralCanvas from "./components/NeuralCanvas";
import Hero from "./components/Hero";
import About from "./components/About";
import Events from "./components/Events";
import Partners from "./components/Partners";
import Team from "./components/Team";
import Newsletter from "./components/Newsletter";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Mascot from "./components/Mascot";
import useHashRoute from "./hooks/useHashRoute";

const QaPage = lazy(() => import("./components/qa/QaPage"));

export default function App() {
  const [showSignals, setShowSignals] = useState(false);
  const { segments } = useHashRoute();
  const isQa = segments[0] === "qa";

  return (
    <>
      <NeuralCanvas showSignals={showSignals} />

      <div className="blobs" aria-hidden="true">
        <span className="blob blob--1" />
        <span className="blob blob--2" />
        <span className="blob blob--3" />
      </div>

      {isQa ? (
        <Suspense fallback={<main className="qa" />}>
          <QaPage />
        </Suspense>
      ) : (
        <>
          <Mascot />
          <Header showSignals={showSignals} onToggleSignals={() => setShowSignals((v) => !v)} />

          <main id="top">
            <Hero />
            <About />
            <Events />
            <Partners />
            <Team />
            <Newsletter />
            <Contact />
          </main>

          <Footer />
        </>
      )}
    </>
  );
}
