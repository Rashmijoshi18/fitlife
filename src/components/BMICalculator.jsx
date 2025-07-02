import { useState } from "react";

const BMICalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState("");

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setBmi(bmiValue);
if (bmiValue < 18.5) {
  setCategory("Underweight 🪶");
} else if (bmiValue >= 18.5 && bmiValue < 25) {
  setCategory("Normal ✅");
} else if (bmiValue >= 25 && bmiValue < 30) {
  setCategory("Overweight ⚠️");
} else {
  setCategory("Obesity 🚨");
}

    }
  };

  return (
    <div id="bmi" className="min-h-screen bg-gray-200 py-40 px-4">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-5xl font-bold mb-8 text-gray-800">BMI Calculator</h2>

        {/* <h2 className="text-4xl font-bold mb-6 text-gray-800">BMI Calculator</h2> */}
        {/* <div className="bg-white rounded-2xl shadow p-8 max-w-md mx-auto"> */}
        <div className="bg-white rounded-2xl shadow p-12 max-w-2xl mx-auto">

          <div className="mb-4 text-left">
            <label className="block font-semibold mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 70"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="mb-4 text-left">
            <label className="block font-semibold mb-2">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 175"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <button
            onClick={calculateBMI}
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-700 transition"
          >
            Calculate BMI
          </button>
          {bmi && (
            <div className="mt-6">
              <p className="text-xl font-bold">Your BMI: {bmi}</p>
              <p className="text-lg text-gray-700">Category: {category}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
