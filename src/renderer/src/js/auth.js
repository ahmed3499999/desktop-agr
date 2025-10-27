export function isAuthenticated_userpage() {
if (sessionStorage.getItem("token") === null) {
    document.location.href = "index.html"
}
}

export function isAuthenticated_loginpage() {
if (sessionStorage.getItem("token") !== null) {
    document.location.href = "user.html";
}
}

