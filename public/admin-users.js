
const API_BASE = "http://localhost:3000";

const usersTableBody = document.getElementById("usersTableBody");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const userCount = document.getElementById("userCount");
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
        throw new Error("Your session is invalid or expired. Please log in again.");
    }

    if (response.status === 403) {
        throw new Error("You don't have permission to manage users.");
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

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "—";
    return cell;
}

function renderUsers(users) {
    usersTableBody.replaceChildren();
    userCount.textContent = users.length;

    if (users.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("No users found.");
        cell.colSpan = 6;
        row.appendChild(cell);
        usersTableBody.appendChild(row);
        return;
    }

    users.forEach(user => {
        const row = document.createElement("tr");

        row.appendChild(createCell(user.id));
        row.appendChild(createCell(user.name));
        row.appendChild(createCell(user.email));

        const roleCell = document.createElement("td");
        const roleBadge = document.createElement("span");
        roleBadge.className =
            `role-badge${user.role === "admin" ? " admin" : ""}`;
        roleBadge.textContent = user.role || "user";
        roleCell.appendChild(roleBadge);
        row.appendChild(roleCell);

        const date = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "—";
        row.appendChild(createCell(date));

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete Account";

        deleteButton.addEventListener("click", () => deleteUser(user, deleteButton));

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        usersTableBody.appendChild(row);
    });
}

async function loadUsers() {
    usersTableBody.replaceChildren();

    const loadingRow = document.createElement("tr");
    const loadingCell = createCell("Loading users...");
    loadingCell.colSpan = 6;
    loadingRow.appendChild(loadingCell);
    usersTableBody.appendChild(loadingRow);

    searchBtn.disabled = true;
    refreshBtn.disabled = true;
    showMessage("");

    try {
        const search = searchInput.value.trim();
        const query = search ? `?search=${encodeURIComponent(search)}` : "";

        const payload = await apiRequest(`/admin/users${query}`);

        renderUsers(payload.users || []);
        showMessage("Users loaded successfully.");
    } catch (error) {
        console.error("Load users error:", error);

        usersTableBody.replaceChildren();
        const row = document.createElement("tr");
        const cell = createCell(error.message);
        cell.colSpan = 6;
        row.appendChild(cell);
        usersTableBody.appendChild(row);

        showMessage(error.message, true);
    } finally {
        searchBtn.disabled = false;
        refreshBtn.disabled = false;
    }
}

async function deleteUser(user, button) {
    const confirmed = window.confirm(
        `Permanently delete the account for ${user.name} (${user.email})?\n\n` +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Deleting...";

    try {
        const payload = await apiRequest(`/admin/users/${user.id}`, {
            method: "DELETE"
        });

        showMessage(payload.message || "User deleted successfully.");
        await loadUsers();
    } catch (error) {
        console.error("Delete user error:", error);
        showMessage(error.message || "Unable to delete user.", true);
        button.disabled = false;
        button.textContent = "Delete Account";
    }
}

searchBtn.addEventListener("click", loadUsers);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") loadUsers();
});

refreshBtn.addEventListener("click", () => {
    searchInput.value = "";
    loadUsers();
});

loadUsers();
