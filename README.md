# 🚀 ProjectNest

<div align="center">
  
**A modern, AI-powered project management platform that helps teams collaborate, plan, and execute projects efficiently.**

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## 🎯 What is ProjectNest?

ProjectNest is an intelligent project management platform that combines traditional task management with cutting-edge AI capabilities. It's designed to help teams brainstorm, plan, organize, and execute projects seamlessly—all in one place.

### Why ProjectNest?

- **AI-Powered Planning**: Generate complete project structures from simple descriptions using Google Gemini AI
- **Visual Collaboration**: Interactive canvas and flowchart tools for brainstorming and architecture planning
- **Smart Chat Assistant**: Context-aware AI that understands your project and helps with decision-making
- **Flexible Organization**: Kanban boards, notes with folders, and customizable workflows
- **Real-time Collaboration**: Share projects, add team members, and track progress together
- **Developer-Friendly**: Built-in database viewer and flowchart tools for technical planning

---

## ✨ Features

### 🤖 AI-Powered Project Creation
- **Instant Project Setup**: Describe your project in natural language, and AI generates a complete structure with tasks and lists
- **Smart Task Generation**: AI understands context and creates relevant, actionable tasks
- **Intelligent Suggestions**: Get AI-powered recommendations for project organization

### 📋 Project Management
- **Kanban Boards**: Drag-and-drop task management with customizable lists
- **Task Organization**: Create, update, move, and track tasks with ease
- **Progress Tracking**: Real-time project progress visualization and analytics
- **Project Members**: Collaborate with team members on shared projects

### 🎨 Visual Collaboration Tools
- **Brainstorm Canvas**: Free-form canvas for visual brainstorming and ideation
- **Flowchart Viewer**: Create and edit Mermaid-based flowcharts and diagrams
- **Interactive Whiteboard**: Draw, annotate, and collaborate visually

### 💬 AI Chat Assistant
- **Project-Aware Conversations**: Chat with AI that understands your project context
- **Multiple Conversations**: Organize discussions by topic or feature
- **Persistent History**: All conversations are saved and searchable

### 📝 Smart Notes
- **Rich Text Editing**: Full markdown support with syntax highlighting
- **Folder Organization**: Organize notes in hierarchical folders
- **Project Scoping**: Notes are organized per project for better context

### 🎨 Customization
- **Theme Support**: Multiple themes including dark mode, light mode, and custom themes
- **User Settings**: Personalized preferences and configurations
- **Flexible Layouts**: Customize your workspace to match your workflow

### 🔒 Security & Authentication
- **JWT-based Authentication**: Secure token-based authentication system
- **Password Encryption**: Industry-standard password hashing with bcrypt
- **User Authorization**: Role-based access control for projects and resources

### 🗄️ Developer Tools
- **Database Viewer**: Built-in database explorer with DBML visualization
- **API Documentation**: RESTful API with clear endpoints and responses
- **Migration System**: Database migration support for schema evolution

---

## 🎬 Demo

See ProjectNest in action! This demo showcases the key features and workflow of the platform:

🎥 **[Watch Demo Video](https://drive.google.com/file/d/1LlupyiBekqpISyifMfQsYOouGi35Pg9f/view?usp=share_link)**

*The demo covers AI-powered project creation, task management, visual collaboration tools, and the integrated chat assistant.*

---

## 🛠️ Tech Stack

**Backend**: Go (Gin framework), PostgreSQL, JWT, Google Gemini AI  
**Frontend**: React, TypeScript, TanStack Query, shadcn/ui, Tailwind CSS  
**Tools**: Mermaid.js, Monaco Editor, Canvas API

---

## 📦 Installation

### Prerequisites

- Go 1.24 or higher
- Node.js 18+ and Bun (or npm)
- PostgreSQL 14+
- Google Gemini API key

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Omzee15/projectNest.git
cd projectNest
```

2. **Setup environment variables**

Backend (`.env` in `Backend/` folder):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=projectnest
DB_SSLMODE=disable

SERVER_PORT=8080
SERVER_HOST=0.0.0.0

APP_ENV=development
LOG_LEVEL=info

FRONTEND_PORT=5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Frontend (`.env` in `Frontend/` folder):
```bash
VITE_PORT=5173
VITE_BACKEND_PORT=8080
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

3. **Run the setup script**
```bash
chmod +x start-projectnest.sh
./start-projectnest.sh
```

Or manually:

**Backend**:
```bash
cd Backend
go mod download
go run cmd/server/main.go
```

**Frontend**:
```bash
cd Frontend
bun install  # or npm install
bun dev      # or npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

---

## 🚀 Usage

### Creating Your First Project

1. **Register/Login**: Create an account or login to access the dashboard
2. **Create a Project**: Click "New Project" and either:
   - Fill in project details manually, or
   - Use AI to generate a project from a description
3. **Organize Tasks**: Create lists and add tasks using the Kanban board
4. **Collaborate**: Add team members to work together
5. **Use AI Tools**: 
   - Chat with the AI assistant for help
   - Use the canvas for brainstorming
   - Create flowcharts for architecture planning

### AI Project Generation

1. Navigate to the Projects page
2. Click "Create with AI"
3. Describe your project (e.g., "Create a todo app with user authentication, task creation, and categories")
4. AI generates a complete project structure with relevant tasks and lists
5. Review and customize as needed

### Brainstorming & Planning

- **Canvas**: Use the interactive canvas for free-form brainstorming
- **Flowcharts**: Create architecture diagrams with Mermaid syntax
- **Notes**: Document ideas, requirements, and specifications

### Task Management

- **Drag & Drop**: Move tasks between lists
- **Real-time Updates**: Changes sync automatically
- **Progress Tracking**: Monitor completion rates and project health

---

## 🏗️ Project Structure

```
projectNest/
├── Backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── handlers/        # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Database operations
│   │   ├── models/          # Data structures
│   │   ├── middleware/      # Auth, logging, etc.
│   │   └── config/          # Configuration
│   ├── migrations/          # Database migrations
│   └── pkg/logger/          # Logging utility
│
└── Frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Page components
    │   ├── services/        # API clients
    │   ├── hooks/           # Custom React hooks
    │   ├── contexts/        # React contexts
    │   └── types/           # TypeScript definitions
    └── public/              # Static assets
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:uid` - Get project details
- `PATCH /api/projects/:uid` - Update project
- `DELETE /api/projects/:uid` - Delete project

### AI Features
- `POST /api/ai/create-project` - Generate project from AI
- `POST /api/chat/:projectUid/conversations` - Create AI conversation
- `POST /api/chat/conversations/:conversationUid/messages` - Send message

### Tasks & Lists
- `POST /api/lists` - Create list
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/move` - Move task to different list

### Notes
- `GET /api/projects/:projectUid/notes` - Get project notes
- `POST /api/projects/:projectUid/notes` - Create note
- `PATCH /api/notes/:uid` - Update note

### Canvas & Collaboration
- `GET /api/canvas/:projectUid` - Get canvas data
- `PUT /api/canvas/:projectUid` - Update canvas

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Google Gemini AI for intelligent project generation
- shadcn/ui for beautiful UI components
- Mermaid.js for flowchart visualization
- The open-source community for amazing tools and libraries

---

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

**Repository**: [https://github.com/Omzee15/projectNest](https://github.com/Omzee15/projectNest)

---

<div align="center">
building (in, with, for) the community
</div>
