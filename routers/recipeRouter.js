const express = require('express');
const router = express.Router();

const auth = require('../middelware/auth');
const recipeController = require('../controllers/recipeController');

router.get('/', auth, recipeController.getAllRecipes);
router.get('/my-recipes', auth, recipeController.getMyRecipes);
router.get('/:id', auth, recipeController.getRecipe);

router.post('/', auth, recipeController.addRecipe);
router.put('/:id', auth, recipeController.editRecipe);
router.delete('/:id', auth, recipeController.deleteRecipe);

module.exports = router;