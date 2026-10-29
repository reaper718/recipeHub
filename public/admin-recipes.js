
const API_BASE = "http://localhost:3000";

const recipesGrid = document.getElementById("recipesGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const recipeCount = document.getElementById("recipeCount");
const pageMessage = document.getElementById("pageMessage");

async function apiRequest(path, options = {}) {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Please log in first.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const payload = await response.json().catch(() => null);

    if (response.status === 401) {
        throw new Error("Your session is invalid or expired.");
    }

    if (response.status === 403) {
        throw new Error("You don't have permission to manage recipes.");
    }

    if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Request failed.");
    }

    return payload;
}

function showMessage(message, isError = false) {
    pageMessage.textContent = message;
    pageMessage.style.color = isError ? "#c0392b" : "#5b4bdb";
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function getCreator(recipe) {
    // The default Sequelize association alias is usually "User".
    const creator = recipe.User || recipe.user;

    if (creator) {
        return creator.name || creator.email || `User #${creator.id}`;
    }

    return recipe.UserId ? `User #${recipe.UserId}` : "Unknown creator";
}

function renderRecipes(recipes) {
    recipesGrid.replaceChildren();
    recipeCount.textContent = recipes.length;

    if (recipes.length === 0) {
        recipesGrid.appendChild(
            createElement("p", "", "No recipes found.")
        );
        return;
    }

    recipes.forEach(recipe => {
        const card = createElement("article", "recipe-card");

        const imageURL = recipe.imageURL || recipe.imageUrl || recipe.image;

        if (imageURL) {
            const image = createElement("img", "recipe-image");
            image.src = imageURL;
            image.alt = recipe.title || "Recipe image";
            image.loading = "lazy";
            image.addEventListener("error", () => image.remove());
            card.appendChild(image);
        }

        const content = createElement("div", "recipe-content");

        content.appendChild(
            createElement("h2", "", recipe.title || "Untitled recipe")
        );

        if (recipe.description) {
            content.appendChild(
                createElement(
                    "p",
                    "recipe-description",
                    recipe.description
                )
            );
        }

        const meta = createElement("div", "recipe-meta");

        if (recipe.category) {
            meta.appendChild(createElement("span", "", recipe.category));
        }

        if (recipe.difficulty) {
            meta.appendChild(createElement("span", "", recipe.difficulty));
        }

        if (recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null) {
            const prep = Number(recipe.prepTimeMinutes) || 0;
            const cook = Number(recipe.cookTimeMinutes) || 0;

            meta.appendChild(
                createElement("span", "", `${prep + cook} min`)
            );
        }

        content.appendChild(meta);

        content.appendChild(
            createElement("p", "creator", `Created by: ${getCreator(recipe)}`)
        );

        const deleteButton = createElement(
            "button",
            "delete-btn",
            "Delete Recipe"
        );

        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => {
            deleteRecipe(recipe, deleteButton);
        });

        content.appendChild(deleteButton);
        card.appendChild(content);
        recipesGrid.appendChild(card);
    });
}

async function loadRecipes() {
    searchBtn.disabled = true;
    refreshBtn.disabled = true;
    recipesGrid.replaceChildren();
    recipesGrid.appendChild(createElement("p", "", "Loading recipes..."));
    showMessage("");

    try {
        const search = searchInput.value.trim();
        const query = search
            ? `?search=${encodeURIComponent(search)}`
            : "";

        const payload = await apiRequest(`/admin/recipes${query}`);

        renderRecipes(payload.recipes || []);
        showMessage("Recipes loaded successfully.");
    } catch (error) {
        console.error("Load recipes error:", error);
        recipesGrid.replaceChildren();
        recipesGrid.appendChild(
            createElement("p", "", error.message || "Unable to load recipes.")
        );
        showMessage(error.message || "Unable to load recipes.", true);
    } finally {
        searchBtn.disabled = false;
        refreshBtn.disabled = false;
    }
}

async function deleteRecipe(recipe, button) {
    const confirmed = window.confirm(
        `Permanently delete "${recipe.title || "this recipe"}"?\n\n` +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
        const payload = await apiRequest(`/admin/recipes/${recipe.id}`, {
            method: "DELETE"
        });

        showMessage(payload.message || "Recipe deleted successfully.");
        await loadRecipes();
    } catch (error) {
        console.error("Delete recipe error:", error);
        showMessage(error.message || "Unable to delete recipe.", true);
        button.disabled = false;
        button.textContent = "Delete Recipe";
    }
}

searchBtn.addEventListener("click", loadRecipes);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") loadRecipes();
});

refreshBtn.addEventListener("click", () => {
    searchInput.value = "";
    loadRecipes();
});

loadRecipes();
