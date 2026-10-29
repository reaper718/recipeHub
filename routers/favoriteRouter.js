const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const favoriteController = require("../controllers/favoriteController");

router.get("/", auth, favoriteController.getFavorites);
router.post("/:id", auth, favoriteController.addFavorite);
router.delete("/:id", auth, favoriteController.removeFavorite);

module.exports = router;