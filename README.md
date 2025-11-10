# 🚀 ProjectNest

<div align="center">
  
**Stop wrestling with scattered tools. ProjectNest brings AI-powered project management, visual collaboration, and intelligent planning into one seamless platform.**

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[The Problem](#-the-problem) • [Solution](#-the-solution) • [Demo](#-demo) • [Quick Start](#-quick-start)

</div>

---

## 🎯 The Problem

**Project management is broken.** Teams juggle multiple tools, lose context switching between apps, and waste hours on setup instead of building.

### What's Wrong Today:
- 📊 **Tool Fragmentation**: Slack for chat, Trello for tasks, Miro for brainstorming, Google Drive for docs
- ⏰ **Setup Overhead**: Hours spent creating project structures, breaking down tasks, organizing workflows
- 🔄 **Context Loss**: Important decisions and discussions scattered across platforms
- 🤖 **No Intelligence**: Tools don't learn from your patterns or suggest improvements
- 👥 **Poor Collaboration**: Team members working in silos, missing the big picture

---

## ✨ The Solution

**ProjectNest unifies everything with AI at its core.** Describe your project in plain English, and get a complete workspace with tasks, organization, and intelligent assistance—instantly.

### Core Capabilities:

🧠 **AI Project Genesis**  
Turn "Build a mobile app for restaurant reviews" into a complete project structure with relevant tasks, timelines, and organization—in seconds.

📋 **Intelligent Task Management**  
Kanban boards that understand your workflow. Drag, drop, and let AI suggest optimizations and next steps.

🎨 **Visual Collaboration Suite**  
Brainstorm on infinite canvas, create flowcharts, and plan architecture—all connected to your project context.

💬 **Context-Aware AI Assistant**  
Chat with an AI that knows your project inside-out. Get suggestions, resolve blockers, and make informed decisions.

📝 **Unified Knowledge Base**  
Notes, docs, and conversations organized by project. No more hunting across platforms for that important decision.

🔐 **Team-Ready Security**  
JWT authentication, role-based access, and secure collaboration from day one.

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

## 📦 Quick Start

### Prerequisites
- Go 1.24+ • Node.js 18+ • PostgreSQL 14+ • Google Gemini API key

### Installation

1. **Clone and setup**
```bash
git clone https://github.com/Omzee15/projectNest.git
cd projectNest
chmod +x start-projectnest.sh
./start-projectnest.sh
```

2. **Configure environment**  
Create `.env` files in `Backend/` and `Frontend/` directories with your database and API credentials.

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

**That's it!** ProjectNest will handle the rest.

---

## 🛠️ Tech Stack

**Backend**: Go (Gin), PostgreSQL, JWT, Google Gemini AI  
**Frontend**: React, TypeScript, TanStack Query, shadcn/ui, Tailwind CSS  
**Tools**: Mermaid.js, Monaco Editor, Canvas API

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

Contributions welcome! Fork → Feature branch → Pull request.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ using Google Gemini AI, shadcn/ui, and the amazing open-source community.

**Repository**: [https://github.com/Omzee15/projectNest](https://github.com/Omzee15/projectNest)

---

<div align="center">
building (in, with, for) the community
</div>
