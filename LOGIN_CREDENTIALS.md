# LearnAID System Login Credentials

## Admin Login
- **Email:** admin@college.edu
- **Password:** admin123
- **Role:** System Administrator
- **Employee ID:** ADM001

## Academic Admin Login  
- **Email:** academic@college.edu
- **Password:** admin123
- **Role:** Academic Administrator
- **Employee ID:** ADM002

## Faculty Login Examples
All faculty passwords are: **faculty123**

### Sample Faculty Accounts:
- **AIDS Department:**
  - facultyaids1@college.edu (password: faculty123)
  - facultyaids2@college.edu (password: faculty123)

- **CSE Department:**
  - facultycse1@college.edu (password: faculty123)
  - facultycse2@college.edu (password: faculty123)

- **ECE Department:**
  - facultyece1@college.edu (password: faculty123)

- **IT Department:**
  - facultyit1@college.edu (password: faculty123)

- **MECH Department:**
  - facultymech1@college.edu (password: faculty123)

- **CIVIL Department:**
  - facultycivil1@college.edu (password: faculty123)
0
## Student Login Examples
All student passwords are: **student123**

### Sample Student Accounts:
- **AIDS Department:**
  - aids2a01@student.college.edu (password: student123)
  - aids3b02@student.college.edu (password: student123)

- **CSE Department:**
  - cse2a01@student.college.edu (password: student123)
  - cse3a01@student.college.edu (password: student123)

- **ECE Department:**
  - ece2a01@student.college.edu (password: student123)

- **IT Department:**
  - it2a01@student.college.edu (password: student123)

## Login URLs:
- **Main Login:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin (after admin login)
- **Faculty Dashboard:** http://localhost:3000/faculty (after faculty login)
- **Student Dashboard:** http://localhost:3000/student (after student login)

## Database Summary:
- **Total Users:** 1,460
- **Students:** 1,437 (across all departments)
- **Faculty:** 22 (distributed across 6 departments)
- **Admins:** 1
- **Departments:** 7 (including admin dept)
- **Subjects:** 32
- **Mark Entries:** 344
- **Study Materials:** 199

## Notes:
- All passwords are set for development purposes
- Student IDs follow format: [DEPT][YEAR][SECTION][NUMBER] (e.g., AIDS2A01)
- Faculty IDs follow format: FAC[DEPT][NUMBER] (e.g., FACAIDS01)
- Change these passwords in production environment