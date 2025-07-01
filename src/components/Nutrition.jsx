import nutritionImage from "../assets/nutrition.jpg";

const Nutrition = () => (
  <section id="nutrition" className="py-20 px-4 bg-white text-black">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start">
      
      <div className="flex-1">
        <h2 className="text-3xl font-extrabold mb-12 text-center uppercase tracking-wider border-b-2 border-gray-300 pb-4">
          Nutrition Essentials
        </h2>
        <div className="relative border-l border-gray-400 ml-4">
          {[
            {
              title: "Hydration",
              desc: "Drink at least 2–3 liters of water daily to optimize performance."
            },
            {
              title: "Whole Foods",
              desc: "Prioritize natural, unprocessed foods to get the most nutrients."
            },
            {
              title: "Protein Intake",
              desc: "Include lean protein in every meal to support muscle recovery."
            },
            {
              title: "Balanced Meals",
              desc: "Combine carbs, protein, and fats for stable energy throughout the day."
            },
            {
              title: "Limit Sugar",
              desc: "Cut down on added sugars to improve energy stability."
            }
          ].map((tip, idx) => (
            <div key={idx} className="mb-10 ml-6">
              <div className="absolute w-3 h-3 bg-black rounded-full -left-1.5 top-1"></div>
              <h3 className="text-xl font-semibold mb-1">{tip.title}</h3>
              <p className="text-gray-700 text-sm">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex justify-center items-center">
        <img
          src={nutritionImage}
          alt="Nutrition Illustration"
          className=" max-h-[500px] w-full object-contain"
        />
      </div>
    </div>
  </section>
);

export default Nutrition;
