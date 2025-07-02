const Contact = () => (
  <section id="contact" className="py-20 px-4 bg-gray-100 text-black">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Contact Us</h2>
      <div className="flex flex-col md:flex-row gap-8">
        
        <div className="flex-1">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4352797.236701567!2d76.20908840000001!3d20.593684!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4c221d21d8dbf%3A0x7f9bb7dc899d0a2f!2sIndia!5e0!3m2!1sen!2sin!4v1719760156710!5m2!1sen!2sin"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="eager"
          ></iframe>
        </div>
        <div className="flex-1">
          <form className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              className="border border-gray-600 bg-gray-200 p-2 rounded text-gray-900"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="border border-gray-600 bg-gray-200 p-2 rounded text-gray-900"
            />
            <textarea
              placeholder="Your Message"
              className="border border-gray-600 bg-gray-200 p-2 rounded text-gray-900"
            />
            <button className="bg-white text-black px-4 py-2 rounded hover:bg-gray-300 transition">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
);

export default Contact;
