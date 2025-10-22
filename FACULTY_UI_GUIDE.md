# Faculty Dashboard UI Guide

## 🎨 Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FACULTY DASHBOARD                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────────────────┐
│              │  Top Bar                                             │
│              │  ┌────────────────────────────────────────────────┐ │
│   SIDEBAR    │  │ Dashboard | Oct 22, 2025 | [Search...] │      │ │
│              │  └────────────────────────────────────────────────┘ │
│ ┌──────────┐ │                                                     │
│ │ LearnAID │ │  Welcome Banner                                    │
│ │  ⚡      │ │  ┌────────────────────────────────────────────┐  │
│ └──────────┘ │  │ Welcome back, Faculty!                      │  │
│              │  │ Here's what's happening...                  │  │
│ [≡] Toggle   │  └────────────────────────────────────────────┘  │
│              │                                                     │
│ 👤 User      │  Stats Cards                                       │
│ faculty@edu  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│              │  │📚 3 │ │📝 5 │ │👥125│ │✓ 7 │                │
│ ───────────  │  │Course│ │Exams│ │Stud.│ │Task │                │
│              │  └─────┘ └─────┘ └─────┘ └─────┘               │
│ 🏠 Dashboard │                                                     │
│ 📚 Courses ◄─┼─ Main Content Area                                │
│ 📄 Chapters  │  ┌────────────────────────────────────┐          │
│ 📋 Exams     │  │ Upcoming Exams       | View All    │          │
│ ✓ Questions  │  ├────────────────────────────────────┤          │
│ 📊 Marks     │  │ □ Data Structures    | Oct 25      │          │
│ 📝 Tasks     │  │   Section A          | [Scheduled] │          │
│              │  ├────────────────────────────────────┤          │
│ ───────────  │  │ □ Algorithms         | Oct 28      │          │
│              │  │   Section B          | [Scheduled] │          │
│ ⚙ Settings   │  └────────────────────────────────────┘          │
│ 🚪 Logout    │                                                     │
│              │  ┌──────────────────┐ ┌────────────────┐         │
└──────────────┤  │ Performance      │ │ Needs Attention│         │
               │  │ ▓▓▓▓▓▓▓░ 78%     │ │ ⚠ Weak: 12    │         │
               │  │ ▓▓▓▓▓▓▓▓▓ 92%    │ │ ⚠ Pending: 8  │         │
               │  └──────────────────┘ └────────────────┘         │
               └──────────────────────────────────────────────────────┘
```

## 🗂️ Course Management View

```
┌─────────────────────────────────────────────────────────────────────┐
│ Course Management                              [+ Add New Course]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │
│  │ Data Structures│  │ Algorithms     │  │ Database Sys.  │      │
│  │ CS101          │  │ CS102          │  │ CS103          │      │
│  │ [Active]       │  │ [Active]       │  │ [Inactive]     │      │
│  │                │  │                │  │                │      │
│  │ Credits: 3     │  │ Credits: 4     │  │ Credits: 3     │      │
│  │ Sem: Fall 2024 │  │ Sem: Fall 2024 │  │ Sem: Fall 2024 │      │
│  │                │  │                │  │                │      │
│  │ [Edit][Stats][🗑] [Edit][Stats][🗑] [Edit][Stats][🗑]  │
│  └────────────────┘  └────────────────┘  └────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 📝 Modal Forms

```
┌───────────────────────────────────────┐
│ Add New Course                    [×] │
├───────────────────────────────────────┤
│                                       │
│ Course Name *                         │
│ ┌───────────────────────────────────┐ │
│ │ Data Structures                   │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Course Code *                         │
│ ┌───────────────────────────────────┐ │
│ │ CS101                             │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Description                           │
│ ┌───────────────────────────────────┐ │
│ │ Introduction to data structures   │ │
│ │ and algorithms...                 │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Credits    Semester      Status       │
│ ┌────┐    ┌──────────┐  ┌────────┐  │
│ │ 3  │    │Fall 2024 │  │ Active ▼   │
│ └────┘    └──────────┘  └────────┘  │
│                                       │
│ ┌──────────────┐  ┌──────────────┐  │
│ │ Create Course│  │    Cancel    │  │
│ └──────────────┘  └──────────────┘  │
└───────────────────────────────────────┘
```

## 🎨 Color Palette

### Primary Colors
- **Sidebar Gradient**: `from-indigo-600 to-purple-700`
- **Active Nav**: `bg-white text-indigo-600`
- **Buttons**: `bg-indigo-600 hover:bg-indigo-700`

### Status Colors
- **Active**: Green (`bg-green-100 text-green-700`)
- **Inactive**: Gray (`bg-gray-100 text-gray-700`)
- **Scheduled**: Yellow (`bg-yellow-100 text-yellow-700`)

### Accent Colors
- **Courses**: Blue (`border-blue-500`)
- **Exams**: Green (`border-green-500`)
- **Students**: Purple (`border-purple-500`)
- **Tasks**: Orange (`border-orange-500`)

## 🔄 Navigation Flow

```
Login → Faculty Dashboard → [Choose Section]
                              │
                              ├─ Dashboard (Overview)
                              ├─ Courses (CRUD)
                              ├─ Chapters (To be enhanced)
                              ├─ Exams (To be enhanced)
                              ├─ Questions (To be enhanced)
                              ├─ Marks & Performance (To be enhanced)
                              └─ Tasks (To be enhanced)
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (Sidebar collapses to icons only)
- **Tablet**: 768px - 1024px (2-column grid)
- **Desktop**: > 1024px (3-column grid)

## ⚡ Interactive Features

### Hover States
- Cards: `hover:shadow-xl`
- Buttons: `hover:bg-[color]-700`
- Sidebar items: `hover:bg-indigo-500`

### Transitions
- All: `transition-all duration-300 ease-in-out`
- Sidebar: `transition-all duration-300`
- Cards: `transition-shadow`

### Loading States
- Spinner: Rotating indigo border
- Skeleton: Gray pulsing placeholders

## 🎯 Key User Actions

### Quick Actions
1. **Add Course**: Click "Add New Course" button → Fill form → Save
2. **Edit Course**: Click "Edit" on card → Modify → Update
3. **Delete Course**: Click trash icon → Confirm → Delete
4. **Toggle Status**: Click "Status" button → Instant toggle
5. **Navigate**: Click sidebar items → Instant section switch

### Form Validation
- Required fields marked with `*`
- Client-side validation
- Server-side error handling
- Success/error messages

---

## 📖 Usage Examples

### Adding a Course
1. Click "Add New Course" in top-right
2. Enter course details (Name, Code required)
3. Optionally add description, credits, semester
4. Select status (Active/Inactive)
5. Click "Create Course"
6. Course appears in grid

### Editing a Course
1. Find course card
2. Click "Edit" button
3. Modify any field
4. Click "Update Course"
5. Changes reflected immediately

### Managing Status
1. Find course card
2. Click "Status" button
3. Status toggles between Active/Inactive
4. Badge color updates automatically

---

**Navigation**: All sections accessible via sidebar
**Data**: Auto-refreshes after CRUD operations
**Feedback**: Toast messages for success/error
**Performance**: Optimized with React hooks and memoization
