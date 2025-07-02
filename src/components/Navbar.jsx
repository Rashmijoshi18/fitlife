const Navbar = () => (
  <header className="bg-black/80 backdrop-blur text-white fixed w-full top-0 z-20 shadow transition-all duration-300">
    <nav className="flex items-center justify-between px-3 py-3">
      {/* Brand on the left */}
      <h1 className="text-lg font-bold tracking-wide hover:text-blue-400 transition cursor-pointer whitespace-nowrap">
        FitLife
      </h1>

      {/* links forced to same line, shrunk text, tight spacing */}
      <ul className="flex flex-nowrap space-x-2 text-xs font-medium">
        <li><a href="#hero" className="hover:text-gray-400 transition">Home</a></li>
        <li><a href="#programs" className="hover:text-gray-400 transition">Programs</a></li>
        <li><a href="#nutrition" className="hover:text-gray-400 transition">Nutrition</a></li>
        <li><a href="#bmi" className="hover:text-gray-400 transition">BMI</a></li>
        <li><a href="#contact" className="hover:text-gray-400 transition">Contact</a></li>
      </ul>
    </nav>
  </header>
);

export default Navbar;
