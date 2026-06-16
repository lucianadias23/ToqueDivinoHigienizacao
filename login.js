const formLogin = document.getElementById("formLogin");

formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const senha = document.getElementById("senha").value;

    if (senha === "123456") {
        localStorage.setItem("adminLogado", "true");
        window.location.href = "admin.html";
    } else {
        alert("Senha inválida.");
    }
});