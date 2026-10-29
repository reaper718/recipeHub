const API_URL = "http://localhost:3000";
// const API_URL = "";

function setAuthToken() {
    const token = sessionStorage.getItem("token");

    if (token) {
        axios.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
}

function handleLogin(event) {
    event.preventDefault();

    const loginDetails = {
        email: event.target.email.value,
        password: event.target.password.value
    };

    axios.post(`${API_URL}/users/login`, loginDetails)
        .then((res) => {
            sessionStorage.setItem("token", res.data.token);
            setAuthToken();

            alert("User logged in successfully");
            window.location.href = "home.html";
        })
        .catch(err => {
            console.log(err.response?.data || err.message);
        });
}


const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const backToLogin = document.getElementById("backToLogin");
const forgotMessage = document.getElementById("forgotMessage");
const LoginForm = document.getElementById('loginForm');

forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();

    LoginForm.classList.add("d-none");

    forgotPasswordForm.classList.remove("d-none");
    forgotMessage.textContent = "";
    document.getElementById("forgotEmail").value = "";
});

backToLogin.addEventListener("click", () => {
    forgotPasswordForm.classList.add("d-none");
    forgotMessage.textContent = "";
    LoginForm.classList.remove("d-none");
});

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("forgotEmail").value.trim();

    try {
        const response = await axios.post(
            `${API_URL}/password/forgotpassword`,
            { email }
        );

        forgotMessage.textContent =
            response.data.message || "Request submitted successfully.";

        forgotMessage.className = "small text-center mt-2 text-success";
    } catch (error) {
        console.error(error);

        forgotMessage.textContent =
            error.response?.data?.message ||
            "Unable to process your request. Please try again.";

        forgotMessage.className = "small text-center mt-2 text-danger";
    }
});