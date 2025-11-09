-- ProjectNest Database Schema
-- PostgreSQL 14+
-- Generated: 2025-11-09

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS task_assignee CASCADE;
DROP TABLE IF EXISTS task CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS list CASCADE;
DROP TABLE IF EXISTS note CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS note_folder CASCADE;
DROP TABLE IF EXISTS canvas CASCADE;
DROP TABLE IF EXISTS brainstorm_canvas CASCADE;
DROP TABLE IF EXISTS project_member CASCADE;
DROP TABLE IF EXISTS workspace_member CASCADE;
DROP TABLE IF EXISTS project CASCADE;
DROP TABLE IF EXISTS workspace CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_uid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create user_settings table
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    settings_uid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(50) NOT NULL DEFAULT 'projectnest-default',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
    auto_save BOOLEAN NOT NULL DEFAULT TRUE,
    auto_save_interval INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create workspace table
CREATE TABLE workspace (
    id SERIAL PRIMARY KEY,
    workspace_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create workspace_member table
CREATE TABLE workspace_member (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspace(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Create project table
CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    project_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#FFFFFF',
    position INTEGER,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE,
    dbml_content TEXT,
    flowchart_content TEXT,
    dbml_layout_data JSONB,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create project_member table
CREATE TABLE project_member (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create list table
CREATE TABLE list (
    id SERIAL PRIMARY KEY,
    list_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#FFFFFF',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create task table
CREATE TABLE task (
    id SERIAL PRIMARY KEY,
    task_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    list_id INTEGER REFERENCES list(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50),
    status VARCHAR(50) DEFAULT 'todo',
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#FFFFFF',
    position INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create task_assignee table
CREATE TABLE task_assignee (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES task(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

-- Create note_folder table
CREATE TABLE note_folder (
    id SERIAL PRIMARY KEY,
    folder_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
    parent_folder_id INTEGER REFERENCES note_folder(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create note table (structured notes)
CREATE TABLE note (
    id SERIAL PRIMARY KEY,
    note_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES note_folder(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{"blocks": []}'::jsonb,
    position INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(user_uid) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_uid) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create notes table (alternative notes structure)
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    note_uid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES note_folder(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create brainstorm_canvas table
CREATE TABLE brainstorm_canvas (
    id SERIAL PRIMARY KEY,
    canvas_uid UUID DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER REFERENCES project(id) ON DELETE CASCADE,
    state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(user_uid) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_uid) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create canvas table
CREATE TABLE canvas (
    id SERIAL PRIMARY KEY,
    canvas_uid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create chat_conversations table
CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    conversation_uid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    message_uid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_uid ON users(user_uid);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_project_user_id ON project(user_id);
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_project_member_project_id ON project_member(project_id);
CREATE INDEX idx_project_member_user_id ON project_member(user_id);
CREATE INDEX idx_list_project_id ON list(project_id);
CREATE INDEX idx_task_list_id ON task(list_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_assignee_task_id ON task_assignee(task_id);
CREATE INDEX idx_task_assignee_user_id ON task_assignee(user_id);
CREATE INDEX idx_note_folder_project_id ON note_folder(project_id);
CREATE INDEX idx_note_project_id ON note(project_id);
CREATE INDEX idx_note_folder_id ON note(folder_id);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_canvas_project_id ON canvas(project_id);
CREATE INDEX idx_brainstorm_canvas_project_id ON brainstorm_canvas(project_id);
CREATE INDEX idx_chat_conversations_project_id ON chat_conversations(project_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_workspace_member_workspace_id ON workspace_member(workspace_id);
CREATE INDEX idx_workspace_member_user_id ON workspace_member(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON project
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_list_updated_at BEFORE UPDATE ON list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON task
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_folder_updated_at BEFORE UPDATE ON note_folder
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_updated_at BEFORE UPDATE ON note
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_updated_at BEFORE UPDATE ON canvas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brainstorm_canvas_updated_at BEFORE UPDATE ON brainstorm_canvas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_updated_at BEFORE UPDATE ON workspace
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables for documentation
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE user_settings IS 'Stores user preferences and settings';
COMMENT ON TABLE project IS 'Main project table with all project metadata';
COMMENT ON TABLE project_member IS 'Manages project team members and their roles';
COMMENT ON TABLE list IS 'Kanban board lists within projects';
COMMENT ON TABLE task IS 'Individual tasks within lists';
COMMENT ON TABLE task_assignee IS 'Task assignment to team members';
COMMENT ON TABLE note_folder IS 'Hierarchical folder structure for notes';
COMMENT ON TABLE note IS 'Structured notes with JSON content';
COMMENT ON TABLE notes IS 'Simple text-based notes';
COMMENT ON TABLE canvas IS 'Canvas data for visual brainstorming';
COMMENT ON TABLE brainstorm_canvas IS 'Brainstorming canvas state';
COMMENT ON TABLE chat_conversations IS 'AI chat conversations within projects';
COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations';
COMMENT ON TABLE workspace IS 'Workspaces to organize multiple projects';
COMMENT ON TABLE workspace_member IS 'Workspace team members';
