const Navbar = () => (
  <header className="bg-black text-white fixed w-full top-0 z-10 shadow">
    <nav className="max-w-6xl mx-auto flex justify-between items-center p-4">
      <h1 className="text-xl font-bold">FitLife</h1>
      <ul className="flex space-x-4">
        <li><a href="#hero" className="hover:text-gray-400">Home</a></li>
        <li><a href="#programs" className="hover:text-gray-400">Programs</a></li>
        <li><a href="#nutrition" className="hover:text-gray-400">Nutrition</a></li>
        <li><a href="#contact" className="hover:text-gray-400">Contact</a></li>
      </ul>
    </nav>
  </header>
);

export default Navbar;
