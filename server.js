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

// ---------- LOGIN API ----------
app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  const table = role === "admin" ? "admin" : "students"; // ✅ match your DB table

  const sql = `SELECT * FROM ${table} WHERE username=? AND password=?`;
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (result.length > 0) {
      const name = result[0].username;
      return res.json({ success: true, role, studentName: name });
    } else {
      return res.json({ success: false, message: "Invalid username or password" });
    }
  });
});





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

  // Get student ID
  const getStudentId = "SELECT id FROM students WHERE username = ?";
  db.query(getStudentId, [student_name], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error finding student" });
    if (result.length === 0) return res.json({ success: false, message: "Student not found" });

    const student_id = result[0].id;

    // Check availability
    const checkCopies = "SELECT copies FROM books WHERE id=?";
    db.query(checkCopies, [book_id], (err2, result2) => {
      if (err2) return res.status(500).json({ success: false, message: "Error checking book" });
      if (result2.length === 0) return res.json({ success: false, message: "Book not found" });
      if (result2[0].copies <= 0) return res.json({ success: false, message: "No copies available" });

      // Insert issue record with student_id
      const issueBook = `
        INSERT INTO issued_books (book_id, student_id, student_name, status, issue_date)
        VALUES (?, ?, ?, 'Issued', CURRENT_DATE)
      `;
      db.query(issueBook, [book_id, student_id, student_name], (err3) => {
        if (err3) return res.status(500).json({ success: false, message: "Error issuing book" });

        const updateCopies = "UPDATE books SET copies = copies - 1 WHERE id=?";
        db.query(updateCopies, [book_id]);
        res.json({ success: true, message: "Book issued successfully" });
      });
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
  const { student_name, role } = req.query; // read from query params

  let query = `
    SELECT ib.id, ib.student_id, b.title, ib.student_name, ib.issue_date, ib.return_date, ib.status
    FROM issued_books ib
    JOIN books b ON ib.book_id = b.id
  `;

  // 🔹 If student, filter by their name
  if (role === "student" && student_name) {
    query += " WHERE ib.student_name = ?";
    db.query(query, [student_name], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Error fetching issued books" });
      res.json(result);
    });
  } else {
    // 🔹 Admin gets all issued books
    query += " ORDER BY ib.id DESC";
    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Error fetching issued books" });
      res.json(result);
    });
  }
});


// ---------- START SERVER ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
