
const API_BASE = "http://localhost:3000";

const recipesGrid = document.getElementById("myRecipesGrid");
const recipeCount = document.getElementById("recipeCount");
const emptyState = document.getElementById("emptyState");
const errorMessage = document.getElementById("errorMessage");

async function loadMyRecipes() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/recipes/my-recipes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            sessionStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "Unable to load your recipes.");
        }

        const recipes = Array.isArray(data.recipes) ? data.recipes : [];

        recipesGrid.replaceChildren();

        recipeCount.textContent =
            `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`;

        emptyState.classList.toggle("d-none", recipes.length > 0);

        recipes.forEach(recipe => {
            const card = document.createElement("article");
            card.className = "my-recipe-card";

            if (recipe.imageURL) {
                const image = document.createElement("img");
                image.className = "my-recipe-image";
                image.src = recipe.imageURL;
                image.alt = recipe.title || "Recipe image";
                image.loading = "lazy";

                image.onerror = () => image.remove();

                card.appendChild(image);
            }

            const content = document.createElement("div");
            content.className = "my-recipe-content";

            const category = document.createElement("span");
            category.className = "my-recipe-category";
            category.textContent = recipe.category || "Other";

            const title = document.createElement("h2");
            title.textContent = recipe.title;

            const description = document.createElement("p");
            description.textContent = recipe.description || "";

            const actions = document.createElement("div");
            actions.className = "my-recipe-actions";

            const viewLink = document.createElement("a");
            viewLink.href =
                `recipe-details.html?id=${encodeURIComponent(recipe.id)}`;
            viewLink.textContent = "View Recipe";

            const editLink = document.createElement("a");
            editLink.href =
                `edit-recipe.html?id=${encodeURIComponent(recipe.id)}`;
            editLink.textContent = "Edit";

            actions.append(viewLink, editLink);
            content.append(category, title, description, actions);
            card.appendChild(content);
            recipesGrid.appendChild(card);
        });

        if (window.lucide &&
            typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }

    } catch (error) {
        console.error("Load my recipes error:", error);
        recipeCount.textContent = "";
        errorMessage.textContent = error.message;
        errorMessage.classList.remove("d-none");
    }
}

loadMyRecipes();
