const Programs = () => (
  <section id="programs" className="py-20 px-4 bg-gray-200 text-black">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl font-extrabold mb-12 text-center uppercase tracking-wider border-b-2 border-gray-600 pb-4">
        Our Programs
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            title: "Strength Training",
            desc: "Build foundational power and perfect your form.",
            level: "Beginner",
            duration: "8 weeks"
          },
          {
            title: "Fat Loss Challenge",
            desc: "High intensity sessions to shred fat effectively.",
            level: "Intermediate",
            duration: "6 weeks"
          },
          {
            title: "Flexibility & Mobility",
            desc: "Recover faster and stay injury-free with guided stretching.",
            level: "Beginner",
            duration: "4 weeks"
          },
          {
            title: "Cardio Blast",
            desc: "Boost your heart health with interval training routines.",
            level: "Advanced",
            duration: "5 weeks"
          }
        ].map((prog, idx) => (
          <div
            key={idx}
            className="border border-gray-700 p-6 rounded bg-white hover:bg-gray-100 shadow hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl font-semibold mb-2">{prog.title}</h3>
              <p className="text-gray-700 mb-4">{prog.desc}</p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Level:</span> {prog.level}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Duration:</span> {prog.duration}
              </p>
            </div>
            <a
              href="#contact"
              className="inline-block mt-4 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Join Now
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Programs;
