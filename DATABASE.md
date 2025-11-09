# ProjectNest Database Documentation

## Overview

ProjectNest uses **PostgreSQL 14+** as its database system. The schema is designed to support a full-featured project management platform with AI capabilities.

## Schema Files

- **`schema.sql`** - Complete PostgreSQL schema ready to import
- **`dbml.sql`** - Database Markup Language format for visualization

## Quick Setup

```bash
# Create database
createdb projectnest

# Import schema
psql -d projectnest -f schema.sql
```

## Database Structure

### Core Tables

#### 1. Users & Authentication
- **`users`** - User accounts with email/password authentication
- **`user_settings`** - User preferences (theme, language, notifications, etc.)

#### 2. Workspace & Projects
- **`workspace`** - Top-level organization container
- **`workspace_member`** - Workspace team members and roles
- **`project`** - Individual projects with metadata
- **`project_member`** - Project team members and roles

#### 3. Task Management
- **`list`** - Kanban board lists (columns)
- **`task`** - Individual tasks with status, priority, assignees
- **`task_assignee`** - Many-to-many relationship for task assignments

#### 4. Notes & Documentation
- **`note_folder`** - Hierarchical folder structure
- **`note`** - Structured notes with JSONB content
- **`notes`** - Simple text-based notes

#### 5. AI & Collaboration
- **`canvas`** - Visual canvas data for brainstorming
- **`brainstorm_canvas`** - Brainstorming sessions state
- **`chat_conversations`** - AI chat conversation threads
- **`chat_messages`** - Individual chat messages

## Key Features

### 1. UUID-Based Security
Every table has a UUID field (e.g., `user_uid`, `project_uid`) for:
- Secure, non-sequential identifiers
- External API references
- Better security than auto-incrementing IDs

### 2. Soft Deletes
Most tables include an `is_active` boolean field:
- Allows data recovery
- Maintains referential integrity
- Supports audit trails

### 3. Audit Trail
Comprehensive tracking with:
- `created_at` / `updated_at` timestamps
- `created_by` / `updated_by` user references
- Automatic timestamp updates via triggers

### 4. JSONB Fields
Flexible data storage for:
- Canvas state (`canvas_data`, `state_json`)
- Note content (`content_json`)
- Project layouts (`dbml_layout_data`)

### 5. Optimized Performance
- Indexed foreign keys for fast joins
- Indexed UUID fields for API lookups
- Indexed status fields for filtering
- Automatic trigger functions for timestamps

## Database Relationships

```
users
  ├─→ user_settings (1:1)
  ├─→ projects (1:many) - owned projects
  ├─→ project_member (many:many) - team projects
  └─→ workspace_member (many:many) - workspaces

project
  ├─→ lists (1:many)
  ├─→ notes (1:many)
  ├─→ canvas (1:1)
  ├─→ chat_conversations (1:many)
  └─→ project_member (many:many)

list
  └─→ tasks (1:many)

task
  └─→ task_assignee (many:many)

note_folder
  ├─→ notes (1:many)
  └─→ note_folder (self-reference for hierarchy)
```

## Indexes

The schema includes indexes on:
- All foreign keys for join performance
- UUID fields for API lookups
- Email for authentication
- Status fields for filtering
- Project/user relationships for access control

## Triggers

Automatic `updated_at` triggers on:
- users
- user_settings
- project
- list
- task
- note_folder
- note
- notes
- canvas
- brainstorm_canvas
- chat_conversations
- workspace

## Migration Strategy

The schema supports evolution through:
1. Version-controlled SQL files
2. Backward-compatible changes
3. Database migration tools (Goose, Flyway, etc.)

Current migrations in `Backend/migrations/`:
- `001_create_user_settings.sql`
- `002_standardize_foreign_keys.sql`

## Visualization

To visualize the database schema:

1. Go to [dbdiagram.io](https://dbdiagram.io/)
2. Copy the contents of `dbml.sql`
3. Paste into the editor
4. View the interactive diagram

## Environment Variables

Configure database connection in `.env`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=projectnest
DB_SSLMODE=disable  # or 'require' for production
```

## Backup & Recovery

### Backup
```bash
pg_dump projectnest > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -d projectnest < backup_20251109.sql
```

## Best Practices

1. **Always use UUIDs** for external references
2. **Use integer IDs** for internal joins (performance)
3. **Enable soft deletes** with `is_active` flags
4. **Track changes** with created_at/updated_at
5. **Index foreign keys** for better join performance
6. **Use JSONB** for flexible, queryable JSON data
7. **Add comments** to tables and columns for documentation

## Production Considerations

- Enable SSL/TLS for database connections
- Use connection pooling (PgBouncer)
- Set up regular backups
- Monitor query performance
- Use read replicas for scaling
- Implement row-level security if needed
- Consider partitioning for large tables

## Common Queries

### Get user's projects
```sql
SELECT p.* FROM project p
WHERE p.user_id = $1 
   OR p.id IN (
     SELECT project_id FROM project_member 
     WHERE user_id = $1
   )
AND p.is_active = true;
```

### Get project tasks with assignees
```sql
SELECT t.*, array_agg(u.name) as assignees
FROM task t
LEFT JOIN task_assignee ta ON t.id = ta.task_id
LEFT JOIN users u ON ta.user_id = u.id
WHERE t.list_id IN (
  SELECT id FROM list WHERE project_id = $1
)
GROUP BY t.id;
```

### Get hierarchical note folders
```sql
WITH RECURSIVE folder_tree AS (
  SELECT * FROM note_folder 
  WHERE parent_folder_id IS NULL AND project_id = $1
  UNION ALL
  SELECT nf.* FROM note_folder nf
  INNER JOIN folder_tree ft ON nf.parent_folder_id = ft.id
)
SELECT * FROM folder_tree;
```

## Support

For database-related issues:
1. Check PostgreSQL logs
2. Verify connection settings in `.env`
3. Ensure PostgreSQL 14+ is installed
4. Check table exists: `\dt` in psql
5. Verify user permissions

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DBML Language](https://www.dbml.org/)
- [dbdiagram.io](https://dbdiagram.io/)
