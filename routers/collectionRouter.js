
const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const collectionController = require("../controllers/collectionController");

router.get("/", auth, collectionController.getCollections);
router.post("/", auth, collectionController.createCollection);

router.get("/:id", auth, collectionController.getCollection);
router.put("/:id", auth, collectionController.updateCollection);
router.delete("/:id", auth, collectionController.deleteCollection);

router.post(
    "/:id/recipes/:recipeId",
    auth,
    collectionController.addRecipeToCollection
);

router.delete(
    "/:id/recipes/:recipeId",
    auth,
    collectionController.removeRecipeFromCollection
);

module.exports = router;
