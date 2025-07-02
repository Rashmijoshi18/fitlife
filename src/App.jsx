import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Programs from "./components/Programs";
import Nutrition from "./components/Nutrition";
// import Testimonials from "./components/Testimonials";
import BMICalculator from "./components/BMICalculator";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const App = () => (
  <div className="font-sans">
    <Navbar />
    <Hero />
    <Programs />
    <Nutrition />
    {/* <Testimonials /> */}
    <BMICalculator />  {/* this must be here */}
    <Contact />
    <Footer />
  </div>
);

export default App;
