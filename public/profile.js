
const API_BASE = "http://localhost:3000";

const profileMessage = document.getElementById("profileMessage");

function getToken() {
    return sessionStorage.getItem("token") || "";
}

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
        throw new Error(payload.message || "Request failed.");
    }

    return payload;
}

function setMessage(message, isError = false) {
    profileMessage.textContent = message;
    profileMessage.style.color = isError ? "#c0392b" : "#77716b";
}

function initials(name = "User") {
    return name.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0] || "")
        .join("")
        .toUpperCase();
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

// Fetch and display profile information.
async function loadProfile() {
    const payload = await apiRequest("/profile");
    const profile = payload.profile;

    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileEmail").value = profile.email || "";
    document.getElementById("profilePhone").value = profile.phone || "";

    document.getElementById("headingName").textContent =
        profile.name || "Recipe lover";

    document.getElementById("headingEmail").textContent =
        profile.email || "";

    document.getElementById("profileAvatar").textContent =
        initials(profile.name || "User");
}

// Update name and phone.
document.getElementById("profileForm").addEventListener("submit", async event => {
    event.preventDefault();

    const saveButton = document.getElementById("saveProfileBtn");
    saveButton.disabled = true;
    setMessage("Saving changes...");

    try {
        const name = document.getElementById("profileName").value.trim();
        const phone = document.getElementById("profilePhone").value.trim();

        const payload = await apiRequest("/profile", {
            method: "PUT",
            body: JSON.stringify({ name, phone })
        });

        const profile = payload.profile;

        document.getElementById("profileName").value = profile.name || "";
        document.getElementById("profilePhone").value = profile.phone || "";
        document.getElementById("headingName").textContent =
            profile.name || "Recipe lover";

        document.getElementById("profileAvatar").textContent =
            initials(profile.name || "User");

        // Keep the existing locally stored user display in sync.
        for (const storage of [sessionStorage, localStorage]) {
            for (const key of ["user", "currentUser", "recipehub_user"]) {
                try {
                    const user = JSON.parse(storage.getItem(key) || "null");

                    if (user && String(user.id) === String(profile.id)) {
                        user.name = profile.name;
                        user.phone = profile.phone;
                        storage.setItem(key, JSON.stringify(user));
                    }
                } catch {
                    // Ignore missing or non-JSON storage values.
                }
            }
        }

        setMessage(payload.message || "Profile updated successfully.");
    } catch (error) {
        setMessage(error.message, true);
    } finally {
        saveButton.disabled = false;
    }
});

// Create a recipe card safely using DOM elements.
function createRecipeCard(recipe) {
    const card = makeElement("article", "recipe-card");

    if (recipe.imageURL || recipe.imageUrl || recipe.image) {
        const image = document.createElement("img");
        image.src = recipe.imageURL || recipe.imageUrl || recipe.image;
        image.alt = recipe.title || "Recipe";
        image.loading = "lazy";

        image.addEventListener("error", () => image.remove());
        card.append(image);
    }

    const content = makeElement("div", "recipe-card-content");
    content.append(
        makeElement("h3", "", recipe.title || "Untitled recipe"),
        makeElement(
            "p",
            "",
            [recipe.category, recipe.difficulty].filter(Boolean).join(" · ")
        )
    );

    const viewLink = makeElement("a", "", "View recipe");
    viewLink.href = `recipe-details.html?id=${encodeURIComponent(recipe.id)}`;
    content.append(viewLink);

    card.append(content);
    return card;
}

function renderRecipeList(containerId, recipes, emptyMessage) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    if (!recipes.length) {
        container.append(makeElement("p", "empty-state", emptyMessage));
        return;
    }

    recipes.forEach(recipe => {
        container.append(createRecipeCard(recipe));
    });
}

// Load recipes created by the logged-in user.
async function loadMyRecipes() {
    const payload = await apiRequest("/recipes/my-recipes");
    const recipes = payload.recipes || [];

    document.getElementById("myRecipeCount").textContent = recipes.length;

    renderRecipeList(
        "myRecipesGrid",
        recipes,
        "You haven't shared any recipes yet."
    );
}

// Load favorited recipes.
async function loadFavorites() {
    const payload = await apiRequest("/favorites");
    const favorites = payload.favorites || [];

    document.getElementById("favoriteCount").textContent = favorites.length;

    renderRecipeList(
        "favoritesGrid",
        favorites,
        "You haven't saved any favorites yet."
    );
}

// Load reviews written by this user.
async function loadMyReviews() {
    const payload = await apiRequest("/reviews/my-reviews");
    const reviews = payload.reviews || [];

    document.getElementById("reviewCount").textContent = reviews.length;

    const container = document.getElementById("reviewsList");
    container.replaceChildren();

    if (!reviews.length) {
        container.append(
            makeElement("p", "empty-state", "You haven't written any reviews yet.")
        );
        return;
    }

    reviews.forEach(review => {
        const card = makeElement("article", "review-card");
        const recipe = review.Recipe || review.recipe || {};
        const title = recipe.title || `Recipe #${review.RecipeId}`;

        card.append(
            makeElement("div", "review-title", title),
            makeElement(
                "div",
                "review-stars",
                `${"★".repeat(Number(review.rating))}${"☆".repeat(5 - Number(review.rating))}`
            ),
            makeElement(
                "p",
                "",
                review.review || "No written comment."
            )
        );

        const link = makeElement("a", "", "View recipe");
        link.href = `recipe-details.html?id=${encodeURIComponent(review.RecipeId || recipe.id)}`;
        card.append(link);

        container.append(card);
    });
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    ["token", "accessToken", "user", "currentUser"].forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    });

    window.location.href = "login.html";
});

async function initializeProfilePage() {
    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }

    const results = await Promise.allSettled([
        loadProfile(),
        loadMyRecipes(),
        loadFavorites(),
        loadMyReviews()
    ]);

    const failed = results.filter(result => result.status === "rejected");

    failed.forEach(result => {
        console.error("Profile section failed to load:", result.reason);
    });

    if (failed.length) {
        setMessage(
            "Some profile information could not be loaded. Refresh the page to try again.",
            true
        );
    }
}

initializeProfilePage();
