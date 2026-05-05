import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Products from "@/components/landing/Products";
import Gallery from "@/components/landing/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Products />
        <Gallery />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
