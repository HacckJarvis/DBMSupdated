const API = "http://localhost:4000";
let allBooks = [];
const role = localStorage.getItem("role");

// ---------- PROTECT ROUTE ----------
if (!localStorage.getItem("isLoggedIn")) {
  window.location = "index.html";
}

// ---------- LOGOUT ----------
function logout() {
  localStorage.clear();
  window.location = "index.html";
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  adjustUIForRole();
});

// ---------- LOAD BOOKS ----------
function loadBooks() {
  fetch(`${API}/books`)
    .then((res) => res.json())
    .then((data) => {
      allBooks = data;
      displayBooks(data);
    })
    .catch(() => Swal.fire("Error", "Failed to load books!", "error"));
}

// ---------- DISPLAY BOOKS ----------
function displayBooks(books) {
  const tbody = document.querySelector("#bookTable tbody");
  tbody.innerHTML = "";
  books.forEach((book) => {
    tbody.innerHTML += `
      <tr>
        <td>${book.id}</td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.isbn}</td>
        <td>${book.copies}</td>
        <td>
          ${
            role === "admin"
              ? `<button onclick="editBook(${book.id}, '${book.title}', '${book.author}', '${book.isbn}', ${book.copies})">✏️ Edit</button>
                 <button onclick="deleteBook(${book.id})" style="background:red;">🗑 Delete</button>`
              : `<button onclick="issueBook(${book.id})" ${book.copies <= 0 ? "disabled" : ""}>📖 Issue</button>`
          }
        </td>
      </tr>`;
  });
}

// ---------- ADD BOOK (Admin Only) ----------
function addBook() {
  if (role !== "admin") return;
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const isbn = document.getElementById("isbn").value;
  const copies = document.getElementById("copies").value;

  fetch(`${API}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, isbn, copies }),
  })
    .then((res) => res.json())
    .then(() => {
      Swal.fire("Added!", "Book added successfully!", "success");
      loadBooks();
    })
    .catch(() => Swal.fire("Error", "Failed to add book!", "error"));
}

// ---------- DELETE BOOK ----------
function deleteBook(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the book.",
    icon: "warning",
    showCancelButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${API}/books/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then(() => {
          Swal.fire("Deleted!", "Book deleted successfully.", "success");
          loadBooks();
        });
    }
  });
}

// ---------- EDIT BOOK ----------
function editBook(id, title, author, isbn, copies) {
  if (role !== "admin") return;

  Swal.fire({
    title: "Edit Book",
    html: `
      <input id="swalTitle" class="swal2-input" placeholder="Title" value="${title}">
      <input id="swalAuthor" class="swal2-input" placeholder="Author" value="${author}">
      <input id="swalIsbn" class="swal2-input" placeholder="ISBN" value="${isbn}">
      <input id="swalCopies" class="swal2-input" type="number" placeholder="Copies" value="${copies}">
    `,
    focusConfirm: false,
    preConfirm: () => {
      const newTitle = document.getElementById("swalTitle").value;
      const newAuthor = document.getElementById("swalAuthor").value;
      const newIsbn = document.getElementById("swalIsbn").value;
      const newCopies = parseInt(document.getElementById("swalCopies").value);

      fetch(`${API}/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          isbn: newIsbn,
          copies: newCopies,
        }),
      })
        .then((res) => res.json())
        .then(() => {
          Swal.fire("Updated!", "Book updated successfully!", "success");
          loadBooks();
        });
    },
  });
}

// ---------- ISSUE BOOK ----------
function issueBook(bookId) {
  if (role !== "student")
    return Swal.fire("Error", "Only students can issue books!", "error");

  fetch(`${API}/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      book_id: bookId,
      student_name: localStorage.getItem("studentName") || "Student",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        Swal.fire("Issued!", "Book issued successfully!", "success");
        loadBooks();
        loadIssuedBooks();
      } else {
        Swal.fire("Unavailable", data.message || "No copies left!", "warning");
      }
    })
    .catch(() => Swal.fire("Error", "Failed to issue book!", "error"));
}

// ---------- LOAD ISSUED BOOKS ----------
function loadIssuedBooks() {
  fetch(
    `${API}/issued?student_name=${encodeURIComponent(
      localStorage.getItem("studentName") || ""
    )}&role=${role}`
  )
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#issuedTable tbody");
      tbody.innerHTML = "";
      data.forEach((item) => {
        tbody.innerHTML += `
          <tr>
            <tbody></tbody>
            <td>${item.student_id}</td>
            <td>${item.title}</td>
            <td>${item.student_name}</td>
            <td>${item.issue_date}</td>
            <td>${item.return_date || "-"}</td>
            <td>${item.status}</td>
            <td>
              ${
                role === "admin" && item.status === "Issued"
                  ? `<button onclick="returnBook(${item.id})">🔙 Return</button>`
                  : "-"
              }
            </td>
          </tr>`;
      });
    });
}

// ---------- RETURN BOOK ----------
function returnBook(id) {
  if (role !== "admin")
    return Swal.fire("Error", "Only admins can return books!", "error");

  fetch(`${API}/return/${id}`, { method: "PUT" })
    .then((res) => res.json())
    .then(() => {
      Swal.fire("Returned!", "Book returned successfully!", "success");
      loadIssuedBooks();
      loadBooks();
    });
}

// ---------- TAB SWITCH ----------
function showTab(tabId) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");

  if (tabId === "issuedList") loadIssuedBooks();
}

// ---------- ROLE-BASED UI ----------
function adjustUIForRole() {
  if (role === "student") {
    const formSection = document.querySelector(".form-section");
    if (formSection) formSection.style.display = "none";

    document.querySelectorAll("button").forEach((btn) => {
      if (
        btn.textContent.includes("Add") ||
        btn.textContent.includes("Delete") ||
        btn.textContent.includes("Edit")
      ) {
        btn.style.display = "none";
      }
    });
  }
}
