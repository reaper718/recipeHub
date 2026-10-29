const API_URL = "http://localhost:3000";
// const API_URL = "";


function handleFormSubmit(event) {
    event.preventDefault();

    const signUp = {
        name: event.target.name.value,
        email: event.target.email.value,
        phone: event.target.phone.value,
        password: event.target.password.value
    }

    axios.post(`${API_URL}/users/signup`,signUp)
        .then((res) => {
            console.log("signup created");
            event.target.reset();
            window.location.href = "login.html";
            
        })
        .catch(err => console.log(err));
}