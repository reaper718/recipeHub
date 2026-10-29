const API_BASE = "http://localhost:3000";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  recipes: [],
  favorites: new Set(),
  favoritesLoaded: false,
  category: "All",
  query: "",
  diet: "All",
  difficulty: "All",
  maxTime: 60,
  sort: "featured",
  favoritesOnly: false,
  apiConnected: false
};

// Safely read JSON from browser storage.
function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

// Prevent recipe text from being interpreted as HTML.
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function totalTime(recipe) {
  return Number(recipe.prepTime ?? recipe.prep_time_minutes ?? 0) +
    Number(recipe.cookTime ?? recipe.cook_time_minutes ?? 0);
}

function getToken() {
  return sessionStorage.getItem("token") || "";
}

function getUser() {
  return readJson("user", null) ||
    readJson("currentUser", null) ||
    readJson("recipehub_user", null);
}

function lucide(name) {
  return `<i data-lucide="${name}"></i>`;
}

function refreshIcons() {
    if (
        window.lucide &&
        typeof window.lucide.createIcons === "function"
    ) {
        window.lucide.createIcons();
    }
}

function notify(message) {
  const el = $("#toastMessage");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

function showMessage(title, body) {
  $("#messageTitle").textContent = title;
  $("#messageBody").textContent = body;
  $("#messageDialog").showModal();
}

function initials(name = "User") {
  return name.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toUpperCase();
}

// Convert backend recipe data into the format used by this page.
function normaliseRecipe(item) {
    return {
        ...item,

        id: item.id,
        title: item.title ?? "Untitled recipe",
        description: item.description ?? "",

        // Match the actual Recipes model.
        image: item.imageURL ?? item.imageUrl ?? item.image_url ?? "",

        author:
            item.author?.name ??
            item.User?.name ??
            item.user?.name ??
            item.authorName ??
            "RecipeHub member",

        category: item.category ?? item.catgeory ?? "Other",
        difficulty: item.difficulty ?? "Easy",

        prepTime: Number(
            item.prepTimeMinutes ?? item.prepTime ?? 0
        ),

        cookTime: Number(
            item.cookTimeMinutes ?? item.cookTime ?? 0
        ),

        servings: Number(item.servings ?? 2),
        rating: Number(item.rating ?? item.averageRating ?? 0),

        dietaryTags: Array.isArray(item.dietaryPreferences)
            ? item.dietaryPreferences
            : Array.isArray(item.dietaryTags)
                ? item.dietaryTags
                : Array.isArray(item.dietary_tags)
                    ? item.dietary_tags
                    : [],

        ingredients: Array.isArray(item.ingredients)
            ? item.ingredients.map(ingredient => {
                if (typeof ingredient === "string") {
                    return ingredient;
                }

                const quantity = ingredient.quantity ?? "";
                const unit = ingredient.unit ?? "";
                const name = ingredient.name ?? "";

                return `${quantity} ${unit} ${name}`.trim();
            })
            : [],

        instructions: Array.isArray(item.instructions)
            ? item.instructions.map(instruction => {
                if (typeof instruction === "string") {
                    return instruction;
                }

                return instruction.instruction ?? "";
            })
            : []
    };
}

// Fetch recipes from the backend.
// If the endpoint is unavailable, the sample recipes remain visible.
async function loadRecipes() {
  console.log("load recipes called")
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const notice = $("#dataNotice");
    const grid = $("#recipeGrid");

    try {
        notice.classList.add("d-none");

        const response = await fetch(`${API_BASE}/recipes`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(
                payload.message || `Request failed: ${response.status}`
            );
        }

        if (payload.success !== true || !Array.isArray(payload.recipes)) {
            throw new Error("Unexpected response format from the recipes API.");
        }

        state.recipes = payload.recipes.map(normaliseRecipe);
        state.apiConnected = true;

        renderRecipes();
    } catch (error) {
        console.error("Unable to load recipes:", error);

        state.recipes = [];
        state.apiConnected = false;

        renderRecipes();

        notice.textContent =
            `Unable to load recipes: ${error.message}`;

        notice.classList.remove("d-none");
    }
}


async function loadFavorites() {
    const token = getToken();

    try {
        const response = await fetch(`${API_BASE}/favorites`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const payload = await response.json();

        if (!response.ok || payload.success !== true) {
            throw new Error(
                payload.message || "Unable to load favorites."
            );
        }

        state.favorites.clear();

        // GET /favorites returns an array of recipe objects.
        payload.favorites.forEach(recipe => {
            state.favorites.add(String(recipe.id));
        });

        state.favoritesLoaded = true;
        renderRecipes();
    } catch (error) {
        console.error("Unable to load favorites:", error);
        notify("Unable to load favorites. Please refresh the page.");
    }
}


// Apply search, category, dietary, difficulty, time, and favorite filters.

function filteredRecipes() {
  const query = state.query.trim().toLowerCase();

  let list = state.recipes.filter(recipe => {
    const tags = Array.isArray(recipe.dietaryTags)
      ? recipe.dietaryTags
      : [];

    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [];

    const searchText = [
      recipe.title,
      recipe.description,
      recipe.category,
      ...tags,
      ...ingredients
    ]
      .map(value => String(value ?? ""))
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query || searchText.includes(query);

    const matchesCategory =
      state.category === "All" ||
      String(recipe.category).toLowerCase() ===
        state.category.toLowerCase();

    const matchesDiet =
      state.diet === "All" ||
      tags.some(tag =>
        String(tag).toLowerCase() === state.diet.toLowerCase()
      );

    const matchesDifficulty =
      state.difficulty === "All" ||
      String(recipe.difficulty).toLowerCase() ===
        state.difficulty.toLowerCase();

    const matchesTime = totalTime(recipe) <= state.maxTime;

    const matchesFavorites =
      !state.favoritesOnly ||
      state.favorites.has(String(recipe.id)) ||
      state.favorites.has(Number(recipe.id));

    return (
      matchesSearch &&
      matchesCategory &&
      matchesDiet &&
      matchesDifficulty &&
      matchesTime &&
      matchesFavorites
    );
  });

  if (state.sort === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  } else if (state.sort === "quickest") {
    list.sort((a, b) => totalTime(a) - totalTime(b));
  } else if (state.sort === "az") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return list;
}


// Display recipe cards.
function renderRecipes() {
  const list = filteredRecipes();

  $("#resultCount").textContent = state.favoritesOnly
    ? `${list.length} saved ${list.length === 1 ? "recipe" : "recipes"}`
    : `${list.length} ${list.length === 1 ? "recipe" : "recipes"} found`;

  $("#recipeGrid").innerHTML = list.map(recipe => {
    const saved = state.favorites.has(recipe.id) ||
      state.favorites.has(String(recipe.id));

    return `
      <article class="recipe-card">
        <div class="recipe-image-wrap">
          ${
            recipe.image
              ? `<img
                  class="recipe-image"
                  src="${escapeHtml(recipe.image)}"
                  alt="${escapeHtml(recipe.title)}"
                  loading="lazy"
                  onerror="this.style.display='none'"
                >`
              : `<div class="image-placeholder">${lucide("cooking-pot")}</div>`
          }

          <span class="recipe-category">${escapeHtml(recipe.category)}</span>

          <button
            class="favorite-btn ${saved ? "saved" : ""}"
            data-favorite="${escapeHtml(recipe.id)}"
            aria-label="${saved ? "Remove favorite" : "Add favorite"}"
            type="button"
          >
            ${lucide("heart")}
          </button>
        </div>

        <div class="recipe-body">
          <div class="recipe-meta">
            <span>
              ${escapeHtml(recipe.difficulty)} ·
              ${escapeHtml(recipe.dietaryTags?.[0] || "Home cooking")}
            </span>
            <span class="rating">${lucide("star")} ${Number(recipe.rating).toFixed(1)}</span>
          </div>

          <h3 class="recipe-title">
            <button data-details="${escapeHtml(recipe.id)}" type="button">
              ${escapeHtml(recipe.title)}
            </button>
          </h3>

          <p class="recipe-description">${escapeHtml(recipe.description)}</p>

          <div class="recipe-footer">
            <span>${lucide("clock")} ${totalTime(recipe)} min</span>
            <span>${lucide("utensils")} ${recipe.servings} servings</span>
          </div>

          <div class="recipe-author">
            <span class="author-avatar">${escapeHtml(initials(recipe.author))}</span>
            <span>By <strong>${escapeHtml(recipe.author)}</strong></span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  $("#emptyState").classList.toggle("d-none", list.length !== 0);
  $("#recipeGrid").classList.toggle("d-none", list.length === 0);

  refreshIcons();
}

function resetFilters() {
  state.category = "All";
  state.query = "";
  state.diet = "All";
  state.difficulty = "All";
  state.maxTime = 60;
  state.sort = "featured";
  state.favoritesOnly = false;

  $("#searchInput").value = "";
  $("#dietFilter").value = "All";
  $("#difficultyFilter").value = "All";
  $("#timeFilter").value = 60;
  $("#timeLabel").textContent = "60 min or less";
  $("#sortFilter").value = "featured";

  $$(".category-chip").forEach(button => {
    button.classList.toggle("active", button.dataset.category === "All");
  });

  $("#favoritesNav").classList.remove("active");

  renderRecipes();
}

// Save or remove a recipe from favorites.

async function toggleFavorite(id) {
    if (!state.favoritesLoaded) {
        notify("Please wait while favorites are loading.");
        return;
    }

    const recipe = state.recipes.find(
        item => String(item.id) === String(id)
    );

    if (!recipe) return;

    const key = String(recipe.id);
    const isSaved = state.favorites.has(key);
    const token = getToken();

    try {
        const response = await fetch(
            `${API_BASE}/favorites/${encodeURIComponent(key)}`,
            {
                method: isSaved ? "DELETE" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const payload = await response.json();

        if (!response.ok || payload.success !== true) {
            throw new Error(
                payload.message || "Unable to update favorite."
            );
        }

        // Update the UI only after the API succeeds.
        if (isSaved) {
            state.favorites.delete(key);
            notify("Removed from favorites.");
        } else {
            state.favorites.add(key);
            notify("Saved to your favorites.");
        }

        renderRecipes();

        if ($("#recipeDialog").open) {
            openRecipeDetails(id);
        }
    } catch (error) {
        console.error("Favorite update failed:", error);
        notify(error.message || "Unable to update favorite.");
    }
}


// Show the details of a selected recipe.

function openRecipeDetails(id) {
    const recipe = state.recipes.find(
        item => String(item.id) === String(id)
    );

    if (!recipe) return;

    const saved = state.favorites.has(String(recipe.id));

    $("#recipeDetails").innerHTML = `
        ${
            recipe.image
                ? `<img class="detail-cover"
                        src="${escapeHtml(recipe.image)}"
                        alt="${escapeHtml(recipe.title)}">`
                : `<div class="detail-cover image-placeholder">
                       ${lucide("cooking-pot")}
                   </div>`
        }

        <div class="detail-content">
            <div class="detail-eyebrow">
                ${escapeHtml(recipe.category)} ·
                ${escapeHtml(recipe.difficulty)}
            </div>

            <h2>${escapeHtml(recipe.title)}</h2>
            <p class="detail-description">
                ${escapeHtml(recipe.description)}
            </p>

            <div class="detail-stats">
                <div class="detail-stat">
                    <strong>${recipe.prepTime} min</strong>
                    Prep time
                </div>
                <div class="detail-stat">
                    <strong>${recipe.cookTime} min</strong>
                    Cook time
                </div>
                <div class="detail-stat">
                    <strong>${recipe.servings}</strong>
                    Servings
                </div>
                <div class="detail-stat">
                    <strong id="detailAverageRating">
                        ★ ${Number(recipe.rating || 0).toFixed(1)}
                    </strong>
                    <span id="detailReviewCount">Rating</span>
                </div>
            </div>

            <div class="detail-columns">
                <section>
                    <h3>Ingredients</h3>
                    <ul>
                        ${
                            recipe.ingredients.length
                                ? recipe.ingredients.map(item =>
                                    `<li>${escapeHtml(item)}</li>`
                                ).join("")
                                : "<li>Ingredients not provided.</li>"
                        }
                    </ul>
                </section>

                <section>
                    <h3>Instructions</h3>
                    <ol>
                        ${
                            recipe.instructions.length
                                ? recipe.instructions.map(item =>
                                    `<li>${escapeHtml(item)}</li>`
                                ).join("")
                                : "<li>Instructions not provided.</li>"
                        }
                    </ol>
                </section>
            </div>

            <div class="detail-actions">
                <button class="btn btn-create"
                        data-favorite="${escapeHtml(recipe.id)}"
                        type="button">
                    ${lucide("heart")}
                    ${saved ? "Remove favorite" : "Save to favorites"}
                </button>
            </div>

            <section class="reviews-section" id="reviewsSection">
                <div class="reviews-heading">
                    <div>
                        <p class="detail-eyebrow">COMMUNITY FEEDBACK</p>
                        <h3>Ratings & Reviews</h3>
                    </div>
                </div>

                <div id="reviewsSummary" class="reviews-summary">
                    Loading reviews...
                </div>

                <form id="reviewForm" data-recipe-id="${escapeHtml(recipe.id)}">
                    <h4 id="reviewFormTitle">Leave your review</h4>

                    <label for="reviewRating">Your rating</label>
                    <div class="star-picker" id="starPicker">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <button type="button"
                                class="star-choice"
                                data-rating="${rating}"
                                aria-label="${rating} star${rating === 1 ? "" : "s"}"
                                aria-pressed="${rating === 5}">
                                ★
                            </button>
                        `).join("")}
                    </div>

                    <input type="hidden" id="reviewRating" value="5">

                    <label for="reviewText">Your review (optional)</label>
                    <textarea
                        id="reviewText"
                        maxlength="2000"
                        rows="4"
                        placeholder="What did you think of this recipe?"
                    ></textarea>

                    <div class="review-form-actions">
                        <button type="submit" class="btn btn-create"
                                id="submitReviewBtn">
                            Submit review
                        </button>
                        <button type="button" class="btn btn-light"
                                id="cancelReviewEdit" hidden>
                            Cancel edit
                        </button>
                    </div>

                    <p id="reviewMessage" role="status"></p>
                </form>

                <div id="reviewsList" class="reviews-list">
                    Loading reviews...
                </div>
            </section>
        </div>
    `;

    $("#recipeDialog").showModal();
    refreshIcons();
    updateStarPicker(5);
    loadReviews(recipe.id);
}

let currentRecipeReviews = [];
let editingReview = false;

function updateStarPicker(rating) {
    const selectedRating = Number(rating);

    $("#reviewRating").value = selectedRating;

    $$(".star-choice", $("#starPicker")).forEach(button => {
        const selected = Number(button.dataset.rating) <= selectedRating;

        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed",
            Number(button.dataset.rating) === selectedRating
                ? "true"
                : "false"
        );
    });
}

function resetReviewForm() {
    const form = $("#reviewForm");
    if (!form) return;

    form.reset();
    editingReview = false;

    $("#reviewRating").value = "5";
    $("#reviewFormTitle").textContent = "Leave your review";
    $("#submitReviewBtn").textContent = "Submit review";
    $("#cancelReviewEdit").hidden = true;
    $("#reviewMessage").textContent = "";

    updateStarPicker(5);
}

async function loadReviews(recipeId) {
    const summary = $("#reviewsSummary");
    const list = $("#reviewsList");

    if (!summary || !list) return;

    summary.textContent = "Loading reviews...";
    list.textContent = "";

    try {
        const response = await fetch(
            `${API_BASE}/reviews/${encodeURIComponent(recipeId)}`,
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        const payload = await response.json();

        if (!response.ok || payload.success !== true) {
            throw new Error(payload.message || "Unable to load reviews.");
        }

        currentRecipeReviews = payload.reviews || [];

        const average = Number(payload.averageRating || 0);
        const total = Number(payload.totalReviews || 0);

        summary.innerHTML = `
            <strong class="average-rating">
                ★ ${average.toFixed(1)}
            </strong>
            <span>
                ${total} ${total === 1 ? "review" : "reviews"}
            </span>
        `;

        renderReviews();
        prepareReviewForm();

        // Update the rating shown in the recipe details.
        $("#detailAverageRating").textContent = `★ ${average.toFixed(1)}`;
        $("#detailReviewCount").textContent =
            `${total} ${total === 1 ? "review" : "reviews"}`;

        // Update the in-memory recipe rating for sorting and display.
        const recipe = state.recipes.find(
            item => String(item.id) === String(recipeId)
        );

        if (recipe) {
            recipe.rating = average;
            renderRecipes();
        }
    } catch (error) {
        console.error("Load reviews failed:", error);
        summary.textContent = error.message;
        list.textContent = "";
    }
}

function prepareReviewForm() {
    const user = getUser();

    const ownReview = currentRecipeReviews.find(review =>
        String(review.UserId) === String(user?.id)
    );

    if (ownReview) {
        editingReview = true;

        $("#reviewFormTitle").textContent = "Edit your review";
        $("#submitReviewBtn").textContent = "Update review";
        $("#reviewRating").value = String(ownReview.rating);
        $("#reviewText").value = ownReview.review || "";
        $("#cancelReviewEdit").hidden = false;

        updateStarPicker(ownReview.rating);
    } else {
        resetReviewForm();
    }
}

function renderReviews() {
    const list = $("#reviewsList");
    if (!list) return;

    list.replaceChildren();

    if (currentRecipeReviews.length === 0) {
        list.append(
            Object.assign(document.createElement("p"), {
                className: "empty-reviews",
                textContent: "No reviews yet. Be the first to review this recipe!"
            })
        );
        return;
    }

    const user = getUser();

    currentRecipeReviews.forEach(review => {
        const card = document.createElement("article");
        card.className = "review-card";

        const reviewerName =
            review.User?.name ||
            review.Users?.name ||
            review.user?.name ||
            "RecipeHub member";

        const date = review.createdAt
            ? new Date(review.createdAt).toLocaleDateString()
            : "";

        const heading = document.createElement("div");
        heading.className = "review-card-heading";

        const author = document.createElement("strong");
        author.textContent = reviewerName;

        const rating = document.createElement("span");
        rating.className = "review-stars";
        rating.textContent = `${"★".repeat(Number(review.rating))}${"☆".repeat(5 - Number(review.rating))}`;

        heading.append(author, rating);
        card.append(heading);

        if (date) {
            const dateElement = document.createElement("p");
            dateElement.className = "review-date";
            dateElement.textContent = date;
            card.append(dateElement);
        }

        const text = document.createElement("p");
        text.className = "review-text";
        text.textContent = review.review || "No written comment.";
        card.append(text);

        if (String(review.UserId) === String(user?.id)) {
            const actions = document.createElement("div");
            actions.className = "review-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "review-edit-btn";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                $("#reviewRating").value = String(review.rating);
                $("#reviewText").value = review.review || "";
                $("#reviewFormTitle").textContent = "Edit your review";
                $("#submitReviewBtn").textContent = "Update review";
                $("#cancelReviewEdit").hidden = false;
                editingReview = true;
                updateStarPicker(review.rating);
                $("#reviewForm").scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "review-delete-btn";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                deleteReview(review.RecipeId);
            });

            actions.append(editButton, deleteButton);
            card.append(actions);
        }

        list.append(card);
    });
}

// Choose a star rating.
document.addEventListener("click", event => {
    const star = event.target.closest(".star-choice");
    if (!star) return;

    updateStarPicker(star.dataset.rating);
});

// Submit a new review or update the existing one.
document.addEventListener("submit", async event => {
    if (event.target.id !== "reviewForm") return;

    event.preventDefault();

    const form = event.target;
    const recipeId = form.dataset.recipeId;
    const rating = Number($("#reviewRating").value);
    const review = $("#reviewText").value.trim();
    const message = $("#reviewMessage");
    const submitButton = $("#submitReviewBtn");

    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        message.textContent = "Please select a rating from 1 to 5.";
        return;
    }

    submitButton.disabled = true;
    message.textContent = "Submitting...";

    try {
        const response = await fetch(
            `${API_BASE}/reviews/${encodeURIComponent(recipeId)}`,
            {
                method: editingReview ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ rating, review })
            }
        );

        const payload = await response.json();

        if (!response.ok || payload.success !== true) {
            throw new Error(payload.message || "Unable to submit review.");
        }

        notify(payload.message || "Review saved successfully.");
        await loadReviews(recipeId);
    } catch (error) {
        message.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

// Cancel editing and return to a blank form.
document.addEventListener("click", event => {
    if (event.target.id !== "cancelReviewEdit") return;
    resetReviewForm();
});

// Delete the current user's review.
async function deleteReview(recipeId) {
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
        const response = await fetch(
            `${API_BASE}/reviews/${encodeURIComponent(recipeId)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        const payload = await response.json();

        if (!response.ok || payload.success !== true) {
            throw new Error(payload.message || "Unable to delete review.");
        }

        notify("Review deleted successfully.");
        await loadReviews(recipeId);
    } catch (error) {
        notify(error.message || "Unable to delete review.");
    }
}


function showFavorites() {
  state.favoritesOnly = !state.favoritesOnly;

  $("#favoritesNav").classList.toggle("active", state.favoritesOnly);

  if (state.favoritesOnly) {
    state.category = "All";
    state.query = "";
    state.diet = "All";
    state.difficulty = "All";
    state.maxTime = 120;

    $("#searchInput").value = "";
    $("#dietFilter").value = "All";
    $("#difficultyFilter").value = "All";
    $("#timeFilter").value = 120;
    $("#timeLabel").textContent = "120 min or less";

    $$(".category-chip").forEach(button => {
      button.classList.toggle("active", button.dataset.category === "All");
    });
  }

  renderRecipes();
  $("#discover").scrollIntoView({ behavior: "smooth" });
}

function updateUserDisplay() {
  const user = getUser();

  const name =
    user?.name ||
    user?.fullName ||
    user?.username ||
    sessionStorage.getItem("name") ||
    localStorage.getItem("name") ||
    "Recipe lover";

  $("#userName").textContent = name;
  $("#userAvatar").textContent = initials(name);
}

// Log the user out and return to login page.
function logout() {
  ["token", "accessToken", "user", "currentUser"].forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });

  notify("Logged out.");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 450);
}

// Search form.
$("#searchForm").addEventListener("submit", event => {
  event.preventDefault();

  state.query = $("#searchInput").value.trim();

  renderRecipes();

  $("#discover").scrollIntoView({ behavior: "smooth" });
});

// Update results as the user types.
$("#searchInput").addEventListener("input", event => {
  state.query = event.target.value.trim();
  renderRecipes();
});

// Category buttons.
$("#categoryRow").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");

  if (!button) return;

  state.category = button.dataset.category;
  state.favoritesOnly = false;

  $("#favoritesNav").classList.remove("active");

  $$(".category-chip").forEach(item => {
    item.classList.toggle("active", item === button);
  });

  renderRecipes();
});

// Dietary filter.
$("#dietFilter").addEventListener("change", event => {
  state.diet = event.target.value;
  renderRecipes();
});

// Difficulty filter.
$("#difficultyFilter").addEventListener("change", event => {
  state.difficulty = event.target.value;
  renderRecipes();
});

// Maximum preparation + cooking time.
$("#timeFilter").addEventListener("input", event => {
  state.maxTime = Number(event.target.value);
  $("#timeLabel").textContent = `${state.maxTime} min or less`;
  renderRecipes();
});

// Sort recipes.
$("#sortFilter").addEventListener("change", event => {
  state.sort = event.target.value;
  renderRecipes();
});

// Reset filters.
$("#resetFilters").addEventListener("click", resetFilters);
$("#emptyReset").addEventListener("click", resetFilters);

// Favorites navigation.
$("#favoritesNav").addEventListener("click", event => {
  event.preventDefault();
  showFavorites();
});


const myRecipesNav = $("#myRecipesNav");

if (myRecipesNav) {
  myRecipesNav.addEventListener("click", event => {
    event.preventDefault();
    window.location.href = "my-recipes.html";
  });
}

// Recipe creation placeholders.
$("#createRecipeBtn").addEventListener("click", () => {
    window.location.href = "create-recipe.html";
});

$("#shareBannerBtn").addEventListener("click", () => {
    window.location.href = "create-recipe.html";
});

// Logout.
$("#logoutBtn").addEventListener("click", logout);

// Mobile navigation.
$("#mobileMenu").addEventListener("click", () => {
  $("#navLinks").classList.toggle("open");
});

// Close dialogs.
$("#closeRecipeDialog").addEventListener("click", () => {
  $("#recipeDialog").close();
});

$("#closeMessageDialog").addEventListener("click", () => {
  $("#messageDialog").close();
});

$("#messageOk").addEventListener("click", () => {
  $("#messageDialog").close();
});

[$("#recipeDialog"), $("#messageDialog")].forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

// Handle favorite and recipe-detail clicks using event delegation.
document.addEventListener("click", event => {
  const favorite = event.target.closest("[data-favorite]");

  if (favorite) {
    toggleFavorite(favorite.dataset.favorite);
    return;
  }

  const details = event.target.closest("[data-details]");

  if (details) {
    openRecipeDetails(details.dataset.details);
  }
});

// Set current year in footer.
$("#currentYear").textContent = new Date().getFullYear();

updateUserDisplay();
renderRecipes();
refreshIcons();

async function initializeHomePage() {
    await Promise.all([
        loadRecipes(),
        loadFavorites()
    ]);
}

initializeHomePage();