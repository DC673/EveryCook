import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MealPlanner.css'; //ensure the css is on the same folder as this code

const MealPlanGenerator = () => {
  const [inputParams, setInputParams] = useState({
    targetCalories: '',
    diet: '',
    minProtein: '',
    minCarbs: '',
    minFat: '',
    minFiber: ''
  });
  const [mealPlan, setMealPlan] = useState([]);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputParams({...inputParams, [name]: value});
  };

  const fetchMealPlan = async (e) => {
    e.preventDefault();
    if (!inputParams.targetCalories) {
      setError('Please specify target calories.');
      return;
    }

    const params = new URLSearchParams({
      apiKey: '5729365de9ff4381b0444ff41a42f065',
      targetCalories: inputParams.targetCalories,
      number: 3 
    });

    ['minProtein', 'minCarbs', 'minFat', 'minFiber'].forEach(nutrient => {
      if (inputParams[nutrient]) {
        params.append(nutrient, inputParams[nutrient]);
      }
    });

    try {
      const response = await axios.get(`https://api.spoonacular.com/recipes/findByNutrients?${params}`);
      setMealPlan(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      setError('Failed to fetch meal plan. Please try again.');
    }
  };

//not bulletproof, needs a value by user for each nutrient field
  return (
    <div className="MealPlanGenerator">
      <h1>Generate a Daily Meal Plan</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={fetchMealPlan}>
        <input
          type="number"
          name="targetCalories"
          className="input"
          placeholder="Target Calories (e.g., 2000)"
          value={inputParams.targetCalories}
          onChange={handleChange}
          required
        />
        <select name="diet" className="select" value={inputParams.diet} onChange={handleChange}>
          <option value="">Select Diet (optional)</option>
          {['vegetarian', 'vegan', 'gluten free', 'ketogenic', 'paleo'].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input
          type="number"
          name="minProtein"
          className="input"
          placeholder="Minimum Protein (g) - optional"
          value={inputParams.minProtein}
          onChange={handleChange}
        />
        <input
          type="number"
          name="minCarbs"
          className="input"
          placeholder="Minimum Carbohydrates (g) - optional"
          value={inputParams.minCarbs}
          onChange={handleChange}
        />
        <input
          type="number"
          name="minFat"
          className="input"
          placeholder="Minimum Fat (g) - optional"
          value={inputParams.minFat}
          onChange={handleChange}
        />
        <input
          type="number"
          name="minFiber"
          className="input"
          placeholder="Minimum Fiber (g) - optional"
          value={inputParams.minFiber}
          onChange={handleChange}
        />
        <button type="submit" className="button">Get Meal Plan</button>
      </form>

      {mealPlan.length > 0 && (
        <div>
          <h2>Your Meal Plan</h2>
          {mealPlan.map((meal, index) => (
            <div key={index} className="meal">
              <h3>{meal.title}</h3>
              <p>Calories: {meal.calories}</p>
              <p>Protein: {meal.protein}</p>
              <p>Carbs: {meal.carbs}</p>
              <p>Fat: {meal.fat}</p>
		  //spawn new page for the recipe
              <Link to={`/recipe/${meal.id}`} className="link">View Recipe</Link>
              <img src={meal.image} alt={meal.title} className="image"/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlanGenerator;

