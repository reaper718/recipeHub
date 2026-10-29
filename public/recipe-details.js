const API_BASE = "http://localhost:3000";

function getLoggedInUserId() {
    const token = sessionStorage.getItem("token");

    if (!token) return null;

    try {
        const payload = token.split(".")[1];
        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const user = JSON.parse(atob(base64));
        return user.id ?? null;
    } catch (error) {
        console.error("Unable to read user ID from token:", error);
        return null;
    }
}

async function loadRecipeDetails() {
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const recipeDetails = document.getElementById("recipeDetails");

    const token = sessionStorage.getItem("token");
    const recipeId = new URLSearchParams(window.location.search).get("id");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (!recipeId || !/^\d+$/.test(recipeId)) {
        loadingMessage.classList.add("d-none");
        errorMessage.textContent = "Invalid recipe ID.";
        errorMessage.classList.remove("d-none");
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/recipes/${encodeURIComponent(recipeId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "Could not load this recipe.");
        }

        const recipe = data.recipe;

        const editButton = document.getElementById("editRecipeBtn");
        const deleteButton = document.getElementById("deleteRecipeBtn");
        const loggedInUserId = getLoggedInUserId();

        const isOwner =
            loggedInUserId !== null &&
            String(recipe.UserId) === String(loggedInUserId);

        editButton.hidden = !isOwner;
        deleteButton.hidden = !isOwner;

        if (!recipe) {
            throw new Error("Recipe not found.");
        }

        document.getElementById("recipeTitle").textContent = recipe.title;
        document.getElementById("recipeDescription").textContent =
            recipe.description || "";
        document.getElementById("recipeCategory").textContent =
            recipe.category || "Other";
        document.getElementById("recipeDifficulty").textContent =
            recipe.difficulty || "Not specified";
        document.getElementById("recipeServings").textContent =
            recipe.servings ?? 1;

        document.getElementById("recipeTime").textContent =
            (Number(recipe.prepTimeMinutes) || 0) +
            (Number(recipe.cookTimeMinutes) || 0);

        const image = document.getElementById("recipeImage");
        const imageURL = recipe.imageURL ?? recipe.imageUrl ?? recipe.image;

        if (imageURL) {
            image.src = imageURL;
            image.alt = recipe.title;
            image.onerror = () => {
                image.classList.add("d-none");
            };
        } else {
            image.classList.add("d-none");
        }

        const ingredientsList = document.getElementById("ingredientsList");
        ingredientsList.replaceChildren();

        (recipe.ingredients || []).forEach(ingredient => {
            const li = document.createElement("li");
            li.textContent = [
                ingredient.quantity,
                ingredient.unit,
                ingredient.name
            ].filter(value => value !== null && value !== undefined && value !== "")
             .join(" ");

            ingredientsList.appendChild(li);
        });

        const instructionsList = document.getElementById("instructionsList");
        instructionsList.replaceChildren();

        (recipe.instructions || [])
            .slice()
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .forEach(step => {
                const li = document.createElement("li");
                li.textContent = step.instruction;
                instructionsList.appendChild(li);
            });

        loadingMessage.classList.add("d-none");
        recipeDetails.classList.remove("d-none");

    } catch (error) {
        console.error("Failed to load recipe:", error);
        loadingMessage.classList.add("d-none");
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
    }
}

loadRecipeDetails();

const editRecipeBtn = document.getElementById("editRecipeBtn");

editRecipeBtn.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get("id");

    if (!recipeId) {
        alert("Recipe ID is missing");
        return;
    }

    window.location.href =
        `edit-recipe.html?id=${encodeURIComponent(recipeId)}`;
});

const deleteRecipeBtn = document.getElementById("deleteRecipeBtn");

deleteRecipeBtn.addEventListener("click", async () => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this recipe? This action cannot be undone."
    );

    if (!confirmed) return;

    const token = sessionStorage.getItem("token");
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get("id");

    if (!token || !recipeId) {
        alert("Please log in again and reopen the recipe.");
        return;
    }

    deleteRecipeBtn.disabled = true;
    deleteRecipeBtn.textContent = "Deleting...";

    try {
        const response = await fetch(
            `http://localhost:3000/recipes/${encodeURIComponent(recipeId)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "Unable to delete recipe.");
        }

        alert("Recipe deleted successfully!");
        window.location.href = "home.html";

    } catch (error) {
        console.error("Delete recipe error:", error);
        alert(error.message || "Something went wrong while deleting.");
        deleteRecipeBtn.disabled = false;
        deleteRecipeBtn.textContent = "🗑️ Delete Recipe";
    }
});