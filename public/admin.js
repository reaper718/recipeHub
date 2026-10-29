
const API_BASE = "http://localhost:3000";

const pageMessage = document.getElementById("pageMessage");

async function loadDashboardStats() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const payload = await response.json();

        if (response.status === 401) {
            pageMessage.textContent = "Your session is invalid. Please log in again.";
            return;
        }

        if (response.status === 403) {
            pageMessage.textContent = "You don't have permission to access the admin dashboard.";
            return;
        }

        if (!response.ok || !payload.success) {
            throw new Error(payload.message || "Unable to load statistics.");
        }

        const stats = payload.stats;

        document.getElementById("totalUsers").textContent = stats.totalUsers;
        document.getElementById("totalRecipes").textContent = stats.totalRecipes;
        document.getElementById("totalReviews").textContent = stats.totalReviews;
        document.getElementById("totalReports").textContent = stats.totalReports;

        pageMessage.textContent = "Dashboard statistics loaded successfully.";
    } catch (error) {
        console.error("Dashboard error:", error);
        pageMessage.textContent = error.message || "Unable to load dashboard.";
    }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");

    window.location.href = "login.html";
});

loadDashboardStats();
