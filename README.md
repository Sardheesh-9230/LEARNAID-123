# LearnAIA - Admin-Centric Educational Management Platform

## Overview

LearnAIA is a comprehensive educational management platform designed specifically for college institutions, with administrators at the core of the system architecture. The platform empowers administrators with complete control over user management, course creation, and resource allocation.

## Key Features

### 🏛️ Admin-Centric Architecture
- **Core Control**: Administrators are the foundation of the platform with comprehensive management capabilities
- **Hierarchical Structure**: Clear role-based access control with admin → departments → faculty/staff → students hierarchy
- **Centralized Management**: Single point of control for all institutional operations

### 🏢 Department Management
- **Create Departments**: Establish various college departments (CS, Mechanical, Business, etc.)
- **Department Structure**: Organize institutional hierarchy with department-based organization
- **Resource Allocation**: Assign resources and personnel to specific departments
- **Cross-Department Coordination**: Manage inter-departmental activities and collaborations

### 🏫 Class Management
- **Classes within Departments**: Create and manage multiple classes within each department
- **Class Scheduling**: Set schedules, capacity, and prerequisites for each class
- **Classroom Assignment**: Allocate physical and virtual classroom resources
- **Academic Planning**: Structure academic programs within departmental frameworks

### 👥 User Management
- **Add Students to Departments**: Assign students to specific departments and classes
- **Staff Assignment**: Assign administrative staff to departments
- **Faculty Assignment**: Assign faculty to teach classes across different departments
- **Role-Based Access**: Ensure appropriate permissions for each user type

### 📚 Course Management
- **Department-Specific Courses**: Create courses linked to departments and classes
- **Course Structure**: Define objectives, prerequisites, and learning outcomes
- **Material Upload**: Centralized content management system
- **Curriculum Planning**: Strategic course planning and organization

### 🎯 Advanced Assignment Features
- **Multi-Department Faculty**: Faculty can teach classes across different departments
- **Student Transfers**: Move students between departments and classes
- **Staff Mobility**: Reassign staff to different departments as needed
- **Resource Optimization**: Ensure optimal resource utilization across departments

## Platform Hierarchy

```
👑 ADMINISTRATOR (Core)
├── 🏢 DEPARTMENTS (CS, Mechanical, Business, Electrical...)
│   ├── 👩‍🏫 FACULTY (Cross-department teaching)
│   ├── 🏫 CLASSES (Within each department)
│   ├── 👥 STAFF (Department administration)
│   └── 👨‍🎓 STUDENTS (Enrolled in department classes)
```

## Technology Stack

- **Frontend**: React with Next.js 14
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Database**: MySQL (planned)
- **Methodology**: Agile with Sprint Framework

## Admin Workflow

1. **Create Departments** - Establish college departments with organizational structure
2. **Setup Classes** - Create classes within departments with schedules and capacity  
3. **Add Users** - Add students to departments/classes and assign staff to departments
4. **Assign Faculty** - Assign faculty to teach different classes across departments
5. **Monitor Progress** - Track department performance and generate comprehensive reports

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles and Tailwind
├── components/
│   ├── Header.tsx          # Navigation with admin and department emphasis
│   ├── Hero.tsx            # Hero section highlighting admin control
│   ├── About.tsx           # Admin-centric mission statement
│   ├── AdminFeatures.tsx   # Core admin capabilities showcase
│   ├── DepartmentStructure.tsx # Department organization display
│   ├── Features.tsx        # Platform architecture overview
│   └── Footer.tsx          # Contact and support information
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd learnaia
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. **Access the Application:**
   - Main Application: [http://localhost:3000](http://localhost:3000)
   - Configuration Panel: Access via the configuration page component
   - Admin Dashboard: Available after authentication

5. **Configuration Setup:**
   - Use the built-in Configuration Page to customize:
     - Application settings (name, version, environment)
     - Database connection settings
     - Authentication preferences
     - Feature toggles
     - UI preferences
   - Settings are automatically saved and applied

## Development Roadmap

### Phase 1: Frontend Foundation ✅
- [x] Admin-centric UI design
- [x] Responsive component architecture
- [x] Role-based interface planning

### Phase 2: Backend Integration (Planned)
- [ ] MySQL database setup
- [ ] User authentication system
- [ ] Admin API endpoints
- [ ] Course management APIs

### Phase 3: Advanced Features (Planned)
- [ ] Real-time analytics dashboard
- [ ] Automated course allocation
- [ ] Performance tracking
- [ ] Report generation system

## Contributing

This project follows Agile methodology with Sprint framework. Please ensure all contributions align with the admin-centric architecture and maintain the hierarchical user structure.

## License

This project is proprietary software for educational institutions.

## Support

For technical support and institutional inquiries:
- Email: support@learnaia.com
- Phone: +1 (555) 123-4567
- Location: San Francisco, CA

---

**LearnAIA** - Empowering Educational Excellence Through Admin-Centric Management
