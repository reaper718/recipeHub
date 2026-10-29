
const API_BASE = "http://localhost:3000";

// Page state
const state = {
    collections: [],
    recipes: [],
    selectedCollectionId: null
};

// DOM elements
const collectionForm = document.getElementById("collectionForm");
const collectionName = document.getElementById("collectionName");
const collectionDescription = document.getElementById("collectionDescription");
const collectionsGrid = document.getElementById("collectionsGrid");
const collectionDetails = document.getElementById("collectionDetails");
const selectedCollectionName = document.getElementById("selectedCollectionName");
const selectedCollectionDescription = document.getElementById("selectedCollectionDescription");
const collectionRecipes = document.getElementById("collectionRecipes");
const recipeSelect = document.getElementById("recipeSelect");
const addRecipeForm = document.getElementById("addRecipeForm");
const formMessage = document.getElementById("formMessage");
const detailsMessage = document.getElementById("detailsMessage");
const pageMessage = document.getElementById("pageMessage");

// Get the JWT token from the existing login flow
function getToken() {
    return sessionStorage.getItem("token");
}

// Send requests with the logged-in user's token
async function apiRequest(path, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Please log in to continue.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    const payload = await response.json();

    if (!response.ok || payload.success !== true) {
        throw new Error(payload.message || "Something went wrong.");
    }

    return payload;
}

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.color = isError ? "#c0392b" : "#707070";
}

function clearMessage(element) {
    element.textContent = "";
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// Load all collections belonging to the logged-in user
async function loadCollections() {
    collectionsGrid.replaceChildren(
        createElement("p", "empty-state", "Loading collections...")
    );

    try {
        const payload = await apiRequest("/collections");

        state.collections = payload.collections || [];
        renderCollections();
    } catch (error) {
        console.error("Loading collections failed:", error);

        collectionsGrid.replaceChildren(
            createElement("p", "empty-state", error.message)
        );
    }
}

// Display collection cards
function renderCollections() {
    collectionsGrid.replaceChildren();

    if (state.collections.length === 0) {
        collectionsGrid.append(
            createElement(
                "p",
                "empty-state",
                "You haven't created any collections yet. Create your first one above!"
            )
        );
        return;
    }

    state.collections.forEach(collection => {
        const card = createElement("article", "collection-card");

        card.append(
            createElement("div", "collection-icon", "📚"),
            createElement("h3", "", collection.name),
            createElement(
                "p",
                "collection-description",
                collection.description || "No description added."
            ),
            createElement(
                "span",
                "collection-count",
                `${(collection.Recipes || []).length} recipe(s)`
            )
        );

        const actions = createElement("div", "card-actions");

        const openButton = createElement("button", "open-btn", "View Recipes");
        openButton.type = "button";
        openButton.addEventListener("click", () => {
            openCollection(collection.id);
        });

        const editButton = createElement("button", "", "Edit");
        editButton.type = "button";
        editButton.addEventListener("click", () => {
            editCollection(collection);
        });

        const deleteButton = createElement("button", "delete-btn", "Delete");
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => {
            deleteCollection(collection.id);
        });

        actions.append(openButton, editButton, deleteButton);
        card.append(actions);
        collectionsGrid.append(card);
    });
}

// Create a new collection
collectionForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage(formMessage);

    const name = collectionName.value.trim();
    const description = collectionDescription.value.trim();

    if (!name) {
        showMessage(formMessage, "Please enter a collection name.", true);
        return;
    }

    const createButton = document.getElementById("createBtn");
    createButton.disabled = true;

    try {
        await apiRequest("/collections", {
            method: "POST",
            body: JSON.stringify({ name, description })
        });

        collectionForm.reset();
        showMessage(formMessage, "Collection created successfully!");

        await loadCollections();
    } catch (error) {
        showMessage(formMessage, error.message, true);
    } finally {
        createButton.disabled = false;
    }
});

// Edit the name and description of a collection
async function editCollection(collection) {
    const name = prompt("Enter the new collection name:", collection.name);

    if (name === null) return;

    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length > 100) {
        alert("Collection name must contain 1–100 characters.");
        return;
    }

    const description = prompt(
        "Enter the collection description:",
        collection.description || ""
    );

    if (description === null) return;

    try {
        await apiRequest(`/collections/${collection.id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: trimmedName,
                description: description.trim()
            })
        });

        showMessage(pageMessage, "Collection updated successfully.");
        await loadCollections();

        if (String(state.selectedCollectionId) === String(collection.id)) {
            await openCollection(collection.id);
        }
    } catch (error) {
        showMessage(pageMessage, error.message, true);
    }
}

// Delete a collection
async function deleteCollection(id) {
    const confirmed = confirm(
        "Delete this collection? Its collection membership records will be removed too."
    );

    if (!confirmed) return;

    try {
        await apiRequest(`/collections/${id}`, {
            method: "DELETE"
        });

        if (String(state.selectedCollectionId) === String(id)) {
            state.selectedCollectionId = null;
            collectionDetails.hidden = true;
        }

        showMessage(pageMessage, "Collection deleted successfully.");
        await loadCollections();
    } catch (error) {
        showMessage(pageMessage, error.message, true);
    }
}

// Load all recipes for the dropdown
async function loadRecipes() {
    const payload = await apiRequest("/recipes");
    state.recipes = payload.recipes || [];

    recipeSelect.replaceChildren(
        createElement("option", "", "Select a recipe")
    );

    state.recipes.forEach(recipe => {
        const option = createElement("option", "", recipe.title);
        option.value = recipe.id;
        recipeSelect.append(option);
    });
}

// Open a collection and display its recipes
async function openCollection(id) {
    clearMessage(detailsMessage);
    collectionDetails.hidden = false;
    collectionRecipes.replaceChildren(
        createElement("p", "empty-state", "Loading recipes...")
    );

    try {
        const payload = await apiRequest(`/collections/${id}`);
        const collection = payload.collection;

        state.selectedCollectionId = collection.id;

        selectedCollectionName.textContent = collection.name;
        selectedCollectionDescription.textContent =
            collection.description || "No description added.";

        renderCollectionRecipes(collection.Recipes || []);

        collectionDetails.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        collectionRecipes.replaceChildren();
        showMessage(detailsMessage, error.message, true);
    }
}

// Render recipes in the selected collection
function renderCollectionRecipes(recipes) {
    collectionRecipes.replaceChildren();

    if (recipes.length === 0) {
        collectionRecipes.append(
            createElement(
                "p",
                "empty-state",
                "This collection is empty. Select a recipe above to add one."
            )
        );
        return;
    }

    recipes.forEach(recipe => {
        const card = createElement("article", "recipe-card");

        if (recipe.imageURL) {
            const image = document.createElement("img");
            image.src = recipe.imageURL;
            image.alt = recipe.title || "Recipe";
            image.loading = "lazy";
            image.addEventListener("error", () => image.remove());
            card.append(image);
        }

        const content = createElement("div", "recipe-card-content");

        content.append(
            createElement("h3", "", recipe.title),
            createElement(
                "p",
                "",
                [recipe.category, recipe.difficulty]
                    .filter(Boolean)
                    .join(" • ") || "Recipe"
            )
        );

        const removeButton = createElement(
            "button",
            "remove-recipe-btn",
            "Remove from collection"
        );

        removeButton.type = "button";
        removeButton.addEventListener("click", () => {
            removeRecipe(recipe.id);
        });

        content.append(removeButton);
        card.append(content);
        collectionRecipes.append(card);
    });
}

// Add a recipe to the currently selected collection
addRecipeForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage(detailsMessage);

    const collectionId = state.selectedCollectionId;
    const recipeId = recipeSelect.value;

    if (!collectionId) {
        showMessage(detailsMessage, "Please open a collection first.", true);
        return;
    }

    if (!recipeId) {
        showMessage(detailsMessage, "Please select a recipe.", true);
        return;
    }

    try {
        const payload = await apiRequest(
            `/collections/${collectionId}/recipes/${recipeId}`,
            { method: "POST" }
        );

        showMessage(detailsMessage, payload.message);

        // Refresh both the recipe list and the displayed recipe count.
        await openCollection(collectionId);
        await loadCollections();

        // Restore the currently open collection after refreshing.
        state.selectedCollectionId = collectionId;
    } catch (error) {
        showMessage(detailsMessage, error.message, true);
    }
});

// Remove a recipe from the currently selected collection
async function removeRecipe(recipeId) {
    const collectionId = state.selectedCollectionId;

    if (!collectionId) return;

    const confirmed = confirm("Remove this recipe from the collection?");
    if (!confirmed) return;

    try {
        const payload = await apiRequest(
            `/collections/${collectionId}/recipes/${recipeId}`,
            { method: "DELETE" }
        );

        showMessage(detailsMessage, payload.message);

        await openCollection(collectionId);
        await loadCollections();

        state.selectedCollectionId = collectionId;
    } catch (error) {
        showMessage(detailsMessage, error.message, true);
    }
}

// Close collection details
document.getElementById("closeDetailsBtn").addEventListener("click", () => {
    collectionDetails.hidden = true;
    state.selectedCollectionId = null;
});

// Refresh collections
document.getElementById("refreshBtn").addEventListener("click", () => {
    loadCollections();
});

// Logout using the existing token storage
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("currentUser");

    window.location.href = "login.html";
});

// Initialize the page
async function initializePage() {
    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }

    try {
        await Promise.all([
            loadCollections(),
            loadRecipes()
        ]);
    } catch (error) {
        console.error("Page initialization failed:", error);
        showMessage(pageMessage, error.message, true);
    }
}

initializePage();
