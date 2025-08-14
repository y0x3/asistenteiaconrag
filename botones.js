

document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.querySelector(".menuHamburgesa");
    const sidebar = document.querySelector(".sidebar");
    const sidebar2 = document.querySelector(".sidebar2");
    const main = document.querySelector(".main");

    // Abrir / cerrar con el botón hamburguesa
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("active");
        sidebar2.classList.toggle("hidden");
        main.classList.toggle("overlay");
    });

    // Cerrar al hacer clic fuera del sidebar
    document.addEventListener("click", (e) => {
        const clickDentroSidebar = sidebar.contains(e.target);
        const clickEnHamburguesa = menuBtn.contains(e.target);

        if (!clickDentroSidebar && !clickEnHamburguesa && sidebar.classList.contains("active")) {
            sidebar.classList.remove("active");
            sidebar2.classList.remove("hidden");
            main.classList.remove("overlay");
        }
    });
});


window.onload = function () {
    google.accounts.id.initialize({
        client_id: "114631407016-q4a5bhholtrl0grpdb1dukm4id8unkjb.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large" }
    );
    google.accounts.id.prompt(); 
};

function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    console.log("Datos usuario:", payload);
    document.getElementById("user-avatar").src = payload.picture;
    document.getElementById("logout").style.display = "block";
    document.getElementById("google-login-btn").style.display = "none";

    fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => res.json())
    .then(data => console.log("Respuesta backend:", data))
    .catch(err => console.error("Error:", err));
}

function parseJwt(token) {
    return JSON.parse(atob(token.split(".")[1]));
}

document.getElementById("logout").addEventListener("click", () => {
    google.accounts.id.disableAutoSelect();

    document.getElementById("user-avatar").src = "https://avatars.githubusercontent.com/u/12345678?v=4";
    document.getElementById("logout").style.display = "none";
    document.getElementById("google-login-btn").style.display = "block";

    console.log("Sesión cerrada");
});

function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    console.log("Datos usuario:", payload);
    document.getElementById("user-avatar").src = payload.picture;
    document.getElementById("logout").style.display = "block";
    document.getElementById("google-login-btn").style.display = "none";
    fetch(`${API_BASE_URL}/login-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            google_id: payload.sub,
            nombre: payload.name,
            email: payload.email,
            avatar_url: payload.picture
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Respuesta backend:", data);
        localStorage.setItem("usuario_id", data.usuario_id);

        // 🔹 Forzar recarga para que index.js lea el nuevo usuario_id
        location.reload();
    })
    .catch(err => {
        console.error("Error en login-google:", err);
    });
}

