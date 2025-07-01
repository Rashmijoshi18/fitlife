import bgImage from "../assets/fitness2.jpg";

const Hero = () => (
  <section
    id="hero"
    className="h-screen flex flex-col justify-center items-center text-white pt-16 bg-cover bg-center"
    style={{
      backgroundImage: `url(${bgImage})`,
    }}
  >
    {/* <div className="bg-black bg-opacity-60 p-8 rounded text-center"> */}
      <h1 className="text-5xl font-extrabold mb-4">Welcome to FitLife</h1>
      <p className="text-xl mb-6 max-w-xl">
        Train. Transform. Succeed.
      </p>
      <a
        href="#programs"
        className="bg-white text-black px-6 py-2 rounded hover:bg-gray-300 transition"
      >
        Get Started
      </a>
    {/* </div> */}
  </section>
);

export default Hero;
