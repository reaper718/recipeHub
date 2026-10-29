
const API_BASE = "http://localhost:3000";

const reviewsList = document.getElementById("reviewsList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const reviewCount = document.getElementById("reviewCount");
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
        throw new Error("You don't have permission to manage reviews.");
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

function renderReviews(reviews) {
    reviewsList.replaceChildren();
    reviewCount.textContent = reviews.length;

    if (reviews.length === 0) {
        reviewsList.appendChild(
            createElement("p", "", "No reviews found.")
        );
        return;
    }

    reviews.forEach(review => {
        const card = createElement("article", "review-card");

        const header = createElement("div", "review-header");
        const details = document.createElement("div");

        const recipe = review.Recipe || review.recipe;
        const reviewer = review.User || review.user;

        details.appendChild(
            createElement(
                "h2",
                "",
                recipe?.title || `Recipe #${review.RecipeId}`
            )
        );

        details.appendChild(
            createElement(
                "p",
                "review-recipe",
                `Reviewer: ${reviewer?.name || reviewer?.email || `User #${review.UserId}`}`
            )
        );

        header.appendChild(details);

        const deleteButton = createElement(
            "button",
            "delete-btn",
            "Delete Review"
        );

        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => {
            deleteReview(review, deleteButton);
        });

        header.appendChild(deleteButton);
        card.appendChild(header);

        const ratingValue = Number(review.rating);
        const rating = createElement(
            "p",
            "rating",
            Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5
                ? `${"★".repeat(ratingValue)}${"☆".repeat(5 - ratingValue)} (${ratingValue}/5)`
                : "Rating unavailable"
        );

        card.appendChild(rating);

        card.appendChild(
            createElement(
                "p",
                "review-text",
                review.review || "No written comment."
            )
        );

        const createdAt = review.createdAt
            ? new Date(review.createdAt).toLocaleString()
            : "Unknown date";

        card.appendChild(
            createElement("p", "review-meta", `Posted: ${createdAt}`)
        );

        reviewsList.appendChild(card);
    });
}

async function loadReviews() {
    searchBtn.disabled = true;
    refreshBtn.disabled = true;

    reviewsList.replaceChildren();
    reviewsList.appendChild(
        createElement("p", "", "Loading reviews...")
    );

    showMessage("");

    try {
        const search = searchInput.value.trim();
        const query = search
            ? `?search=${encodeURIComponent(search)}`
            : "";

        const payload = await apiRequest(`/admin/reviews${query}`);

        renderReviews(payload.reviews || []);
        showMessage("Reviews loaded successfully.");
    } catch (error) {
        console.error("Load reviews error:", error);

        reviewsList.replaceChildren();
        reviewsList.appendChild(
            createElement("p", "", error.message || "Unable to load reviews.")
        );

        showMessage(error.message || "Unable to load reviews.", true);
    } finally {
        searchBtn.disabled = false;
        refreshBtn.disabled = false;
    }
}

async function deleteReview(review, button) {
    const confirmed = window.confirm(
        `Permanently delete review #${review.id}?\n\n` +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
        const payload = await apiRequest(`/admin/reviews/${review.id}`, {
            method: "DELETE"
        });

        showMessage(payload.message || "Review deleted successfully.");
        await loadReviews();
    } catch (error) {
        console.error("Delete review error:", error);
        showMessage(error.message || "Unable to delete review.", true);

        button.disabled = false;
        button.textContent = "Delete Review";
    }
}

searchBtn.addEventListener("click", loadReviews);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") loadReviews();
});

refreshBtn.addEventListener("click", () => {
    searchInput.value = "";
    loadReviews();
});

loadReviews();
