// 📚 Library Management System Backend (Final Version)
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- DATABASE CONNECTION ----------
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "asps1234",
  database: process.env.DB_NAME || "library_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected!");
});

// ---------- LOGIN (Admin / Student) ----------
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return showError("Please fill all fields!");

  fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", role);
        window.location = "dashboard.html";
      } else {
        showError(data.message || "Invalid username or password!");
      }
    })
    .catch(() => showError("Server error"));
}


// ---------- FETCH ALL BOOKS ----------
app.get("/books", (req, res) => {
  db.query("SELECT * FROM books", (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching books" });
    res.json(result);
  });
});

// ---------- ADD BOOK ----------
app.post("/books", (req, res) => {
  const { title, author, isbn, copies } = req.body;
  const sql = "INSERT INTO books (title, author, isbn, copies) VALUES (?,?,?,?)";
  db.query(sql, [title, author, isbn, copies], (err) => {
    if (err) return res.status(500).json({ message: "Error adding book" });
    res.json({ success: true, message: "Book added successfully" });
  });
});

// ---------- UPDATE BOOK ----------
app.put("/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, copies } = req.body;
  const sql = "UPDATE books SET title=?, author=?, isbn=?, copies=? WHERE id=?";
  db.query(sql, [title, author, isbn, copies, id], (err) => {
    if (err) return res.status(500).json({ message: "Error updating book" });
    res.json({ success: true, message: "Book updated successfully" });
  });
});

// ---------- DELETE BOOK ----------
app.delete("/books/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM books WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting book" });
    res.json({ success: true, message: "Book deleted successfully" });
  });
});

// ---------- ISSUE BOOK ----------
app.post("/issue", (req, res) => {
  const { book_id, student_name } = req.body;

  // Check availability
  const checkCopies = "SELECT copies FROM books WHERE id=?";
  db.query(checkCopies, [book_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error checking book" });

    if (result.length === 0)
      return res.json({ success: false, message: "Book not found" });
    if (result[0].copies <= 0)
      return res.json({ success: false, message: "No copies available" });

    const issueBook = `
      INSERT INTO issued_books (book_id, student_name, status, issue_date)
      VALUES (?, ?, 'Issued', CURRENT_DATE)
    `;
    db.query(issueBook, [book_id, student_name], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Error issuing book" });

      const updateCopies = "UPDATE books SET copies = copies - 1 WHERE id=?";
      db.query(updateCopies, [book_id]);
      res.json({ success: true, message: "Book issued successfully" });
    });
  });
});

// ---------- RETURN BOOK ----------
app.put("/return/:id", (req, res) => {
  const { id } = req.params;

  const getBook = "SELECT book_id FROM issued_books WHERE id=? AND status='Issued'";
  db.query(getBook, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error finding issue record" });
    if (result.length === 0) return res.json({ success: false, message: "Record not found" });

    const book_id = result[0].book_id;
    const updateReturn = `
      UPDATE issued_books
      SET status='Returned', return_date=CURRENT_DATE
      WHERE id=?
    `;
    db.query(updateReturn, [id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Error updating record" });

      const updateBook = "UPDATE books SET copies = copies + 1 WHERE id=?";
      db.query(updateBook, [book_id]);
      res.json({ success: true, message: "Book returned successfully" });
    });
  });
});

// ---------- VIEW ISSUED BOOKS ----------
app.get("/issued", (req, res) => {
  const query = `
    SELECT ib.id, b.title, ib.student_name, ib.issue_date, ib.return_date, ib.status
    FROM issued_books ib
    JOIN books b ON ib.book_id = b.id
    ORDER BY ib.id DESC
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error fetching issued books" });
    res.json(result);
  });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
