const API = "http://localhost:4000";
let role = "admin"; // default

function setRole(selected) {
  role = selected;
  document.getElementById("adminBtn").classList.remove("active");
  document.getElementById("studentBtn").classList.remove("active");
  document.getElementById(selected + "Btn").classList.add("active");
}

function showError(message) {
  Swal.fire({ icon: "error", title: "Oops!", text: message });
}

function showSuccess(message) {
  Swal.fire({ icon: "success", title: "Success", text: message });
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return showError("Please fill all fields!");

  const endpoint = role === "admin" ? "/login" : "/student-login";

  fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password,role }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", role);
        window.location = "dashboard.html";
      } else {
        showError("Invalid username or password!");
      }
    })
    .catch(() => showError("Server error"));
}
