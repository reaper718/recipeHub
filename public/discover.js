
const API_BASE = "http://localhost:3000";

const usersGrid = document.getElementById("usersGrid");
const searchUsers = document.getElementById("searchUsers");
const peopleCount = document.getElementById("peopleCount");
const pageMessage = document.getElementById("pageMessage");

let allUsers = [];
let currentUserId = null;
let followingIds = new Set();

function getToken() {
  return sessionStorage.getItem("token");
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
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed.");
  }

  return payload;
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

function showMessage(message, isError = false) {
  pageMessage.textContent = message;
  pageMessage.style.color = isError ? "#c0392b" : "#5b4bdb";
}

async function loadDiscoverPage() {
  try {
    if (!getToken()) {
      window.location.href = "login.html";
      return;
    }

    const [profile, users, following] = await Promise.all([
      apiRequest("/profile"),
      apiRequest("/users/getAllUsers"),
      apiRequest("/follows/following")
    ]);

    // GET /profile returns { success: true, profile: {...} }
    currentUserId = Number(profile.profile.id);

    // GET /users/getAllUsers returns a plain array.
    allUsers = Array.isArray(users) ? users : [];

    // GET /follows/following returns { success: true, users: [...] }
    followingIds = new Set(
      (following.users || []).map(user => Number(user.id))
    );

    renderUsers();
  } catch (error) {
    console.error("Load discover page error:", error);
    usersGrid.replaceChildren();

    const message = document.createElement("p");
    message.textContent = error.message || "Unable to load users.";
    usersGrid.appendChild(message);

    showMessage("Could not load people. Please try again.", true);
  }
}

function renderUsers() {
  const searchTerm = searchUsers.value.trim().toLowerCase();

  const filteredUsers = allUsers.filter(user => {
    if (Number(user.id) === currentUserId) return false;

    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();

    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  peopleCount.textContent = filteredUsers.length;
  usersGrid.replaceChildren();

  if (filteredUsers.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = searchTerm
      ? "No people match your search."
      : "No other users found yet.";

    usersGrid.appendChild(emptyMessage);
    return;
  }

  filteredUsers.forEach(user => {
    const isFollowing = followingIds.has(Number(user.id));

    const card = document.createElement("article");
    card.className = "user-card";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = getInitials(user.name);
    avatar.setAttribute("aria-hidden", "true");

    const name = document.createElement("h2");
    name.textContent = user.name || "RecipeHub user";

    const email = document.createElement("p");
    email.className = "user-email";
    email.textContent = user.email || "";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `follow-btn${isFollowing ? " following" : ""}`;
    button.textContent = isFollowing ? "Following" : "Follow";
    button.dataset.userId = user.id;
    button.dataset.following = String(isFollowing);
    button.setAttribute(
      "aria-label",
      `${isFollowing ? "Unfollow" : "Follow"} ${user.name || "user"}`
    );

    button.addEventListener("click", () => toggleFollow(user.id, button));

    card.append(avatar, name, email, button);
    usersGrid.appendChild(card);
  });
}

async function toggleFollow(userId, button) {
  const id = Number(userId);
  const wasFollowing = followingIds.has(id);

  button.disabled = true;
  showMessage("");

  try {
    const result = await apiRequest(
      `/follows/${encodeURIComponent(id)}`,
      { method: wasFollowing ? "DELETE" : "POST" }
    );

    if (result.success) {
      if (wasFollowing) {
        followingIds.delete(id);
        showMessage("You unfollowed this user.");
      } else {
        followingIds.add(id);
        showMessage("You are now following this user.");
      }

      renderUsers();
    }
  } catch (error) {
    console.error("Follow action error:", error);
    showMessage(error.message || "Unable to update follow status.", true);
    button.disabled = false;
  }
}

searchUsers.addEventListener("input", renderUsers);

loadDiscoverPage();
