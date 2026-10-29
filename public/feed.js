
const API_BASE = "http://localhost:3000";

const activityList = document.getElementById("activityList");
const feedMessage = document.getElementById("feedMessage");

function getToken() {
  return sessionStorage.getItem("token");
}

function getInitials(name) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

async function loadActivityFeed() {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/feed`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Unable to load activity.");
    }

    renderActivities(payload.activities || []);
  } catch (error) {
    console.error("Load activity feed error:", error);
    feedMessage.textContent = error.message || "Unable to load activity.";
  }
}

function renderActivities(activities) {
  activityList.replaceChildren();

  if (activities.length === 0) {
    feedMessage.textContent = "";

    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "Your feed is quiet for now. Follow people to see their new recipes and reviews here.";

    activityList.appendChild(empty);
    return;
  }

  feedMessage.textContent = `${activities.length} recent activities`;

  activities.forEach(activity => {
    const card = document.createElement("article");
    card.className = "activity-card";

    const header = document.createElement("div");
    header.className = "activity-header";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = getInitials(activity.user?.name);
    avatar.setAttribute("aria-hidden", "true");

    const userInfo = document.createElement("div");

    const userName = document.createElement("p");
    userName.className = "activity-user";
    userName.textContent = activity.user?.name || "RecipeHub user";

    const time = document.createElement("span");
    time.className = "activity-time";
    time.textContent = formatDate(activity.createdAt);

    userInfo.append(userName, time);
    header.append(avatar, userInfo);
    card.appendChild(header);

    const type = document.createElement("p");
    type.className = "activity-type";

    if (activity.type === "recipe") {
      type.textContent = "Published a new recipe";
      card.appendChild(type);

      const recipe = activity.recipe || {};

      const title = document.createElement("h2");
      title.textContent = recipe.title || "Untitled recipe";
      card.appendChild(title);

      if (recipe.imageURL) {
        const image = document.createElement("img");
        image.className = "recipe-image";
        image.src = recipe.imageURL;
        image.alt = recipe.title || "Recipe image";
        image.loading = "lazy";

        image.addEventListener("error", () => image.remove());
        card.appendChild(image);
      }

      if (recipe.description) {
        const description = document.createElement("p");
        description.className = "activity-description";
        description.textContent = recipe.description;
        card.appendChild(description);
      }

      addRecipeLink(card, recipe.id);
    } else if (activity.type === "review") {
      type.textContent = "Posted a review";
      card.appendChild(type);

      const recipe = activity.recipe || {};
      const review = activity.review || {};

      const title = document.createElement("h2");
      title.textContent = recipe.title || "A recipe";
      card.appendChild(title);

      const rating = document.createElement("p");
      rating.className = "rating";
      const stars = Number(review.rating);

      rating.textContent = Number.isInteger(stars) && stars >= 1 && stars <= 5
        ? `${"★".repeat(stars)}${"☆".repeat(5 - stars)} (${stars}/5)`
        : "Rating unavailable";

      card.appendChild(rating);

      if (review.text) {
        const reviewText = document.createElement("p");
        reviewText.className = "activity-description";
        reviewText.textContent = review.text;
        card.appendChild(reviewText);
      }

      addRecipeLink(card, recipe.id);
    }

    activityList.appendChild(card);
  });
}

function addRecipeLink(card, recipeId) {
  if (!recipeId) return;

  const link = document.createElement("a");
  link.className = "recipe-link";
  link.href = `recipe-details.html?id=${encodeURIComponent(recipeId)}`;
  link.textContent = "View recipe →";

  card.appendChild(link);
}

loadActivityFeed();
