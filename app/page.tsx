import Header from './components/Header';
import HeroCarousel from './components/HeroCarousel';
import BookingModule from './components/BookingModule';
import Features from './components/Features';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div id="home">
      <Header />
      <HeroCarousel />
      <BookingModule />
      <Features />
      <Footer />
    </div>
  );
}