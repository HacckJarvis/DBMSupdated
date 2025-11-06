# 📚 Library Management System

A simple and interactive **Library Management System** built with\
**HTML, CSS, JavaScript (Frontend)** and **Node.js, Express, MySQL
(Backend)**.

This project supports **Admin** and **Student** roles with separate
privileges.

------------------------------------------------------------------------

## 🚀 Features

### 👨‍💼 Admin

-   Login securely as Admin\
-   Add new books with title, author, ISBN, and copies\
-   Edit existing book details\
-   Delete books from the library\
-   View all issued books

### 🎓 Student

-   Login securely as Student\
-   View all available books\
-   Issue books directly from the dashboard\
-   View only their issued books\
-   Return books they have issued

------------------------------------------------------------------------

## 🧱 Tech Stack

  Category        Technologies Used
  --------------- ----------------------------------------------
  **Frontend**    HTML5, CSS3, Vanilla JavaScript, SweetAlert2
  **Backend**     Node.js, Express.js
  **Database**    MySQL
  **Libraries**   body-parser, cors, dotenv, mysql

------------------------------------------------------------------------

## ⚙️ Setup Instructions

### 1️⃣ Clone or Download

``` bash
git clone https://github.com/yourusername/library-management-system.git
cd library-management-system
```

### 2️⃣ Install Dependencies

``` bash
npm install
```

### 3️⃣ Configure Database

Create a database in MySQL using the provided SQL file:

``` sql
library_db.sql
```

You can run this script in **MySQL Workbench** or your preferred MySQL
client.

### 4️⃣ Set Environment Variables

Create a `.env` file in the project root and add:

``` env
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=library_db
PORT=4000
```

### 5️⃣ Run the Server

``` bash
node server.js
```

If successful, you'll see:

    ✅ MySQL Connected!
    🚀 Server running on port 4000

### 6️⃣ Open the Frontend

Open `index.html` in your browser.

------------------------------------------------------------------------

## 🧩 Default Credentials

  Role      Username   Password
  --------- ---------- -----------
  Admin     admin      admin123
  Admin     aditya     aditya123
  Student   adi        adi123

------------------------------------------------------------------------

## 🗂️ Folder Structure

    library-management-system/
    │
    ├── server.js               # Node.js backend
    ├── library_db.sql          # MySQL schema and sample data
    ├── .env                    # Environment variables
    │
    ├── index.html              # Login page
    ├── login.js                # Login script
    ├── style.css               # Login page styles
    │
    ├── dashboard.html          # Main dashboard after login
    ├── dashboard.js            # Dashboard logic
    ├── dashboard.css           # Dashboard styles
    │
    └── README.md               # Project documentation

------------------------------------------------------------------------

## 🧠 How It Works

1.  **Login Page (`index.html`)**
    -   Choose role: Admin or Student
    -   Verify credentials through `/login` API
2.  **Dashboard (`dashboard.html`)**
    -   Admin and Student dashboards share the same layout but different
        permissions
    -   Admin can manage books; Students can issue or return them
3.  **Book Issuing**
    -   When a Student issues a book:
        -   Copies count decreases
        -   Record saved in `issued_books` table
    -   When returned:
        -   Status changes to "Returned"
        -   Copies count increases

------------------------------------------------------------------------

## 🧾 Database Tables

### 1. `admin`

  id   username   password
  ---- ---------- ----------

### 2. `students`

  id   username   password
  ---- ---------- ----------

### 3. `books`

  id   title   author   isbn   copies
  ---- ------- -------- ------ --------

### 4. `issued_books`

  id   book_id   student_name   issue_date   return_date   status
  ---- --------- -------------- ------------ ------------- --------

------------------------------------------------------------------------

## 💡 Notes

-   Ensure MySQL service is running before starting the server.
-   For testing, run both backend (`node server.js`) and frontend (open
    `index.html` in browser).
-   This version doesn't include a unique `student_id`; it tracks issued
    books by `student_name`.
