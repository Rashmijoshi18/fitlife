const Contact = () => (
  <section id="contact" className="py-20 px-4 bg-gray-100 text-black">
    <div className="max-w-5xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
      <form className="flex flex-col space-y-4 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Your Name"
          className="border border-gray-600 bg-gray-200 p-2 rounded text-grey-700"
        />
        <input
          type="email"
          placeholder="Your Email"
          className="border border-gray-600 bg-gray-200 p-2 rounded text-grey-700"
        />
        <textarea
          placeholder="Your Message"
          className="border border-gray-600 bg-gray-200 p-2 rounded text-grey-700"
        />
        <button className="bg-white text-black px-4 py-2 rounded hover:bg-gray-300 transition">
          Send
        </button>
      </form>
    </div>
  </section>
);

export default Contact;
