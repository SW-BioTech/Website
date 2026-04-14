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

export default function App() {
  return (
    <>
      <NeuralCanvas />
      <Mascot />

      <div className="blobs" aria-hidden="true">
        <span className="blob blob--1" />
        <span className="blob blob--2" />
        <span className="blob blob--3" />
      </div>

      <Header />

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
  );
}
