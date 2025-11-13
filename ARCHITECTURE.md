# LearnAID System Architecture

> **Educational Management Platform with AI-Powered Learning Support**  
> A comprehensive system for administrators, faculty, and students with intelligent MCQ generation and performance tracking.

---

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        USER[👤 Users<br/>Admin/Faculty/Student]
    end

    subgraph "Application Layer"
        FRONTEND[Next.js Frontend<br/>React 18 + TypeScript]
        BACKEND[Express.js Backend<br/>REST API]
    end

    subgraph "Core Services"
        AUTH[Authentication<br/>JWT + RBAC]
        DEPT[Department<br/>Management]
        COURSE[Course & Subject<br/>Management]
        EXAM[CIA Exam<br/>Assessment]
        AI[AI MCQ Generator<br/>RAG Pipeline]
    end

    subgraph "AI/ML Layer"
        LANGCHAIN[LangChain<br/>Framework]
        VECTOR[Vector Store<br/>In-Memory DB]
        GROQ[Groq AI<br/>Mixtral-8x7b]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB Atlas)]
        FILES[File Storage<br/>PDF Documents]
    end

    USER --> FRONTEND
    FRONTEND --> BACKEND
    
    BACKEND --> AUTH
    BACKEND --> DEPT
    BACKEND --> COURSE
    BACKEND --> EXAM
    BACKEND --> AI
    
    AI --> LANGCHAIN
    LANGCHAIN --> VECTOR
    LANGCHAIN --> GROQ
    
    AUTH --> MONGO
    DEPT --> MONGO
    COURSE --> MONGO
    EXAM --> MONGO
    AI --> MONGO
    AI --> FILES

    style USER fill:#e3f2fd
    style FRONTEND fill:#c8e6c9
    style BACKEND fill:#fff9c4
    style AI fill:#fce4ec
    style GROQ fill:#f8bbd0
    style MONGO fill:#ffecb3
```

## 🎭 User Role Architecture

```mermaid
graph LR
    ADMIN[👑 Admin<br/>System Control]
    FACULTY[👩‍🏫 Faculty<br/>Teaching]
    STUDENT[👨‍🎓 Student<br/>Learning]
    
    ADMIN -->|manages| DEPT[Departments]
    ADMIN -->|creates| USERS[Users]
    
    FACULTY -->|creates| COURSES[Courses]
    FACULTY -->|uploads| MATERIALS[Materials]
    FACULTY -->|generates| MCQ[MCQ via AI]
    FACULTY -->|assesses| STUDENT
    
    STUDENT -->|accesses| COURSES
    STUDENT -->|takes| EXAMS[Exams]
    STUDENT -->|views| PERFORMANCE[Performance]

    style ADMIN fill:#4caf50
    style FACULTY fill:#2196f3
    style STUDENT fill:#ff9800
    style MCQ fill:#e91e63
```

## 🔄 Core Business Flows

### Course & Assessment Workflow

```mermaid
flowchart LR
    A[Create Course] --> B[Add Chapters]
    B --> C[Upload Materials]
    C --> D[Create CIA Exam]
    D --> E[Map Questions<br/>to Chapters]
    E --> F[Enter Marks]
    F --> G[Chapter-wise<br/>Analysis]
    G --> H[Auto-assign<br/>Tasks]
    
    style D fill:#bbdefb
    style G fill:#fff9c4
    style H fill:#ffccbc
```

## 🤖 AI-Powered MCQ Generation Architecture

### RAG Pipeline Architecture

```mermaid
graph TB
    subgraph "Input"
        PDF[📄 PDF Document]
        TOPIC[📝 Topic/Chapter]
    end
    
    subgraph "Text Processing"
        EXTRACT[Text Extraction<br/>pdf-parse]
        CHUNK[Text Chunking<br/>1000 char blocks]
    end
    
    subgraph "RAG Layer"
        VECTOR[Vector Store<br/>In-Memory Search]
        RETRIEVE[Context Retrieval<br/>Top 5 Relevant]
    end
    
    subgraph "AI Generation"
        LANGCHAIN[LangChain<br/>Orchestration]
        PROMPT[Prompt Builder<br/>Topic + Context]
        GROQ[Groq AI API<br/>Mixtral-8x7b-32768]
    end
    
    subgraph "Output"
        VALIDATE[JSON Validation]
        MCQ[✅ MCQ Questions<br/>Options + Answers]
    end
    
    PDF --> EXTRACT
    EXTRACT --> CHUNK
    CHUNK --> VECTOR
    TOPIC --> RETRIEVE
    VECTOR --> RETRIEVE
    RETRIEVE --> LANGCHAIN
    LANGCHAIN --> PROMPT
    PROMPT --> GROQ
    GROQ --> VALIDATE
    VALIDATE --> MCQ

    style VECTOR fill:#e1f5fe
    style GROQ fill:#f8bbd0
    style MCQ fill:#c8e6c9
```

### MCQ Generation Sequence

```mermaid
sequenceDiagram
    participant F as Faculty
    participant API as Backend
    participant RAG as RAG Pipeline
    participant AI as Groq AI

    F->>API: Upload PDF + Topic
    API->>RAG: Parse PDF
    RAG->>RAG: Extract & Chunk Text
    RAG->>RAG: Build Vector Store
    RAG->>RAG: Search by Topic
    RAG->>AI: Generate MCQs<br/>(Context + Topic)
    AI->>RAG: Return JSON
    RAG->>API: Validate MCQs
    API->>F: Display Questions

    Note over RAG: Context ensures<br/>relevance to material
```

## 📊 Data Architecture

### Core Data Model

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : contains
    DEPARTMENT ||--o{ SUBJECT : offers
    USER ||--o{ SUBJECT : teaches
    USER ||--o{ MATERIAL : uploads
    SUBJECT ||--o{ CHAPTER : contains
    CHAPTER ||--o{ MATERIAL : includes
    SUBJECT ||--o{ CIA_EXAM : has
    CIA_EXAM ||--o{ QUESTION : contains
    QUESTION ||--o{ MARKS : records
    MARKS ||--o{ PERFORMANCE : tracks

    DEPARTMENT {
        ObjectId id PK
        string name
        string code UK
    }

    USER {
        ObjectId id PK
        string email UK
        enum role
        ObjectId department FK
    }

    SUBJECT {
        ObjectId id PK
        string name
        ObjectId department FK
        array faculty FK
    }

    CIA_EXAM {
        ObjectId id PK
        ObjectId subject FK
        string examType
    }

    QUESTION {
        ObjectId id PK
        ObjectId exam FK
        ObjectId chapter FK
        int marks
    }

    MARKS {
        ObjectId id PK
        ObjectId student FK
        ObjectId question FK
        int marksObtained
    }

    PERFORMANCE {
        ObjectId id PK
        ObjectId student FK
        ObjectId chapter FK
        float percentage
    }
```

## 🛠️ Technology Stack

```mermaid
mindmap
  root((LearnAID))
    Frontend
      Next.js 14
      React 18
      TypeScript
      Tailwind CSS
    Backend
      Node.js
      Express.js
      MongoDB
      Mongoose
      JWT Auth
    AI/ML
      Groq API
      Mixtral-8x7b
      LangChain
      pdf-parse
      Vector Store
    DevOps
      Git
      npm
      VS Code
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + React 18 | Server-side rendering, routing |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Backend** | Express.js + Node.js | REST API server |
| **Database** | MongoDB + Mongoose | Document database with ODM |
| **Authentication** | JWT + bcrypt | Secure token-based auth |
| **AI Service** | Groq API (Mixtral) | LLM for MCQ generation |
| **RAG** | LangChain + pdf-parse | Document processing & retrieval |
| **Vector Store** | In-Memory | Semantic search for context |

## 🔐 Security Architecture

```mermaid
graph TB
    CLIENT[Client Browser]
    
    subgraph "Security Layers"
        HTTPS[HTTPS/TLS]
        JWT[JWT Authentication]
        RBAC[Role-Based Access]
        VALIDATE[Input Validation]
        ENCRYPT[Password Encryption]
    end
    
    CLIENT --> HTTPS
    HTTPS --> JWT
    JWT --> RBAC
    RBAC --> VALIDATE
    VALIDATE --> ENCRYPT

    style JWT fill:#ef5350
    style RBAC fill:#ec407a
    style ENCRYPT fill:#ab47bc
```

### Security Implementation

| Component | Implementation |
|-----------|----------------|
| **Transport** | HTTPS with TLS 1.3 |
| **Authentication** | JWT tokens with bcrypt hashing |
| **Authorization** | Role-based middleware (Admin/Faculty/Student) |
| **Validation** | express-validator for input sanitization |
| **File Security** | Multer with file type & size validation |
| **API Protection** | Rate limiting & CORS policies |

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_FE[Frontend :3000]
        DEV_BE[Backend :5000]
    end
    
    subgraph "Production"
        VERCEL[Vercel<br/>Next.js]
        HEROKU[Heroku<br/>Express API]
        MONGO[MongoDB Atlas]
        GROQ[Groq Cloud API]
    end
    
    DEV_FE -.development.-> VERCEL
    DEV_BE -.development.-> HEROKU
    
    VERCEL --> HEROKU
    HEROKU --> MONGO
    HEROKU --> GROQ

    style VERCEL fill:#00c853
    style HEROKU fill:#7e57c2
    style MONGO fill:#4caf50
    style GROQ fill:#f06292
```

## 🌐 API Architecture

```mermaid
graph TB
    ROOT[API Gateway<br/>:5000/api]
    
    ROOT --> AUTH[/auth<br/>Login, Profile]
    ROOT --> USERS[/users<br/>CRUD]
    ROOT --> DEPTS[/departments<br/>Management]
    ROOT --> SUBJECTS[/subjects<br/>Courses]
    ROOT --> MATERIALS[/materials<br/>Upload/View]
    ROOT --> EXAMS[/exams<br/>CIA Exams]
    ROOT --> MCQ[/mcq<br/>AI Generation]
    ROOT --> ANALYTICS[/analytics<br/>Reports]

    style ROOT fill:#fff9c4
    style MCQ fill:#fce4ec
    style ANALYTICS fill:#e1f5fe
```

### Core API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth` | POST, GET | Login, authentication, profile |
| `/api/departments` | GET, POST, PUT, DELETE | Department management |
| `/api/subjects` | GET, POST, PUT, DELETE | Subject/course management |
| `/api/materials` | GET, POST, DELETE | Material upload & management |
| `/api/exams` | GET, POST, PUT | CIA exam configuration |
| `/api/questions` | GET, POST | Question-chapter mapping |
| `/api/marks` | GET, POST | Mark entry & calculation |
| `/api/performance` | GET | Chapter-wise analytics |
| `/api/mcq/generate` | POST | AI-powered MCQ generation |
| `/api/analytics` | GET | Dashboard statistics |

## 📦 System Components

### Application Layers

```mermaid
graph TB
    subgraph "Frontend"
        PAGES[Pages/Routes]
        COMPONENTS[UI Components]
        SERVICES[API Services]
    end
    
    subgraph "Backend"
        ROUTES[API Routes]
        CONTROLLERS[Controllers]
        MODELS[Data Models]
    end
    
    PAGES --> COMPONENTS
    COMPONENTS --> SERVICES
    SERVICES --> ROUTES
    ROUTES --> CONTROLLERS
    CONTROLLERS --> MODELS

    style PAGES fill:#e3f2fd
    style CONTROLLERS fill:#c8e6c9
    style MODELS fill:#fff9c4
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Department Management** | Hierarchical organization structure |
| **User Management** | Role-based access (Admin/Faculty/Student) |
| **Course Management** | Subjects, chapters, materials |
| **CIA Exam System** | Question-chapter mapping for analysis |
| **Chapter-wise Performance** | Automated calculation from marks |
| **AI MCQ Generation** | RAG-powered question generation |
| **Task Assignment** | Auto-assign tasks for weak students |
| **Analytics Dashboard** | System-wide insights and reports |

---

**Version**: 1.0.0  
**Last Updated**: November 13, 2025  
**Architecture**: Layered Architecture  
**Methodology**: Agile Development

---

## 🎯 Key Features

### Core Capabilities

| Feature | Description | Users |
|---------|-------------|-------|
| **Department Management** | Create, organize, and manage departments with hierarchical structure | Admin |
| **User Management** | CRUD operations for students, faculty, and staff with role-based access | Admin |
| **Subject Management** | Create subjects, assign faculty, enroll students | Admin, Faculty |
| **Material Management** | Upload, view, download, and organize learning materials | Faculty, Student |
| **AI MCQ Generation** | Generate contextually relevant questions from PDF materials using RAG | Faculty |
| **Assessment System** | Create and manage CIA exams with automated grading | Faculty |
| **Performance Analytics** | Track student performance with chapter-wise breakdown | Faculty, Student |
| **Dashboard Analytics** | System-wide insights and reporting | Admin |

### Advanced Features

- **RAG-Powered AI**: Retrieval-Augmented Generation ensures MCQs are contextually relevant to uploaded materials
- **Automated Performance Tracking**: Chapter-wise performance calculation based on question mapping
- **Role-Based Access Control**: Granular permissions for Admin, Faculty, and Student roles
- **File Management**: Secure upload, storage, and streaming of PDF materials
- **Interactive Quizzes**: Take MCQ quizzes with immediate feedback and explanations
- **Analytics Dashboard**: Real-time insights into user activity, enrollments, and system health

---

## � System Scalability

### Horizontal Scaling Strategy

```mermaid
graph LR
    LB[Load Balancer]
    
    subgraph "Application Servers"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server N]
    end
    
    subgraph "Database Cluster"
        PRIMARY[(Primary)]
        REPLICA1[(Replica 1)]
        REPLICA2[(Replica 2)]
    end
    
    subgraph "Cache Layer"
        REDIS[Redis Cluster]
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS
    
    API1 --> PRIMARY
    API2 --> PRIMARY
    API3 --> PRIMARY
    
    PRIMARY --> REPLICA1
    PRIMARY --> REPLICA2

    style LB fill:#4caf50
    style REDIS fill:#ff9800
```

### Performance Optimization

- **Database Indexing**: Optimized queries with compound indexes on frequently accessed fields
- **Caching Strategy**: Redis for session management and frequently accessed data
- **CDN Integration**: Static assets and PDFs served via Content Delivery Network
- **Lazy Loading**: Code splitting and dynamic imports for faster initial load
- **API Rate Limiting**: Prevent abuse and ensure fair resource allocation
- **Connection Pooling**: Efficient database connection management

---

## 📝 Development Methodology

### Agile Sprint Framework

```mermaid
gantt
    title LearnAID Development Sprints
    dateFormat  YYYY-MM-DD
    section Sprint 1
    Backend Setup           :done, s1, 2024-01-01, 14d
    Authentication         :done, s1a, after s1, 7d
    section Sprint 2
    Faculty Module         :done, s2, 2024-01-22, 21d
    Course Management      :done, s2a, after s2, 7d
    section Sprint 3
    Student Module         :done, s3, 2024-02-19, 21d
    Assessment System      :done, s3a, after s3, 7d
    section Sprint 4
    AI Integration         :done, s4, 2024-03-18, 21d
    MCQ Generation         :done, s4a, after s4, 7d
    section Sprint 5
    Analytics & Polish     :active, s5, 2024-04-15, 14d
```

### Code Quality Standards

- **TypeScript**: Full type coverage for frontend code
- **ESLint**: Consistent code style and best practices
- **Documentation**: JSDoc comments for all functions
- **Error Handling**: Comprehensive try-catch blocks with logging
- **Testing**: Unit tests for critical business logic
- **Code Review**: Peer review before merging to main branch

---

## 🔄 Future Enhancements

### Planned Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Real-time Chat** | Student-faculty communication system | High |
| **Video Integration** | Embed lecture videos in chapters | High |
| **Mobile App** | React Native mobile application | Medium |
| **Offline Mode** | PWA with offline capabilities | Medium |
| **Advanced Analytics** | ML-powered insights and predictions | High |
| **Gamification** | Badges, leaderboards, achievements | Low |
| **Calendar Integration** | Exam schedules and reminders | Medium |
| **Notification System** | Email and push notifications | High |

### Technical Debt

- [ ] Migrate to MySQL for relational data integrity
- [ ] Implement comprehensive unit test coverage
- [ ] Add integration tests for critical workflows
- [ ] Set up proper logging infrastructure
- [ ] Implement API documentation with Swagger
- [ ] Add monitoring and alerting system
- [ ] Optimize PDF processing for large files
- [ ] Implement background job processing

---

## 📚 References

### Documentation Links

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **MongoDB**: https://docs.mongodb.com
- **Mongoose**: https://mongoosejs.com/docs
- **Express**: https://expressjs.com
- **Groq API**: https://console.groq.com/docs
- **LangChain**: https://js.langchain.com/docs

### Project Resources

- **GitHub Repository**: `github.com/Sardheesh-9230/LEARNAID-123`
- **API Documentation**: `/api-docs` (Swagger UI)
- **Development Guide**: `project-plans/DEVELOPMENT_INSTRUCTIONS.md`
- **Quick Start**: `project-plans/QUICK_START_GUIDE.md`

---

**Version**: 1.0.0  
**Last Updated**: November 13, 2025  
**Architecture**: Layered + Microservices-ready  
**Methodology**: Agile with Sprint Framework  
**License**: MIT
