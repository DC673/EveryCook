import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MealPantry.css';  // make sure the css is in the the same folder as this code

const MealPantry = () => {
  const [ingredients, setIngredients] = useState(['', '', '']);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState('');

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const fetchRecipes = async () => {
    if (ingredients.some(ingredient => ingredient.trim() === '')) {
      setError('Please fill in all ingredient fields.');
      return;
    }

    const queryString = ingredients.filter(i => i.trim() !== '').join(',');
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(queryString)}&number=10&apiKey=5729365de9ff4381b0444ff41a42f065`;

    try {
      const response = await axios.get(url);
      setRecipes(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes. Please try again.');
    }
  };

  return (
    <div className="meal-pantry">
      <h1>Meal Pantry</h1>
      {error && <p className="error-message">{error}</p>}
      <div>
        {ingredients.map((ingredient, index) => (
          <input
            key={index}
            type="text"
            value={ingredient}
            onChange={(e) => handleIngredientChange(index, e.target.value)}
            placeholder="Enter an ingredient"
          />
        ))}
      </div>
      <button onClick={fetchRecipes}>Find Recipes</button>

      <div className="recipes">
        {recipes.map(recipe => (
          <div key={recipe.id} className="recipe">
            <h3>{recipe.title}</h3>
            <img src={recipe.image} alt={recipe.title} />
            <Link to={`/recipe/${recipe.id}`}>View Recipe</Link> {/* Link to recipe detail page */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPantry;

