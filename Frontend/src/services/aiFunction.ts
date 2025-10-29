// Function calling schemas for AI to manipulate lists and tasks
import { List, Task, ListRequest, TaskRequest } from '@/types';
import { SchemaType } from '@google/generative-ai';

export interface FunctionCallResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Function schemas that define what the AI can do
export const FUNCTION_SCHEMAS = [
  {
    name: "create_list",
    description: "Create a new list in the project",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: "The name of the list to create"
        },
        color: {
          type: SchemaType.STRING,
          description: "The color of the list in hex format (e.g., #3B82F6). Optional."
        },
        position: {
          type: SchemaType.NUMBER,
          description: "The position of the list. Optional, defaults to end."
        }
      },
      required: ["name"]
    }
  },
  {
    name: "update_list",
    description: "Update an existing list",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        list_uid: {
          type: SchemaType.STRING,
          description: "The UID of the list to update"
        },
        name: {
          type: SchemaType.STRING,
          description: "The new name for the list. Optional."
        },
        color: {
          type: SchemaType.STRING,
          description: "The new color for the list in hex format. Optional."
        },
        position: {
          type: SchemaType.NUMBER,
          description: "The new position for the list. Optional."
        }
      },
      required: ["list_uid"]
    }
  },
  {
    name: "delete_list",
    description: "Delete a list and all its tasks",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        list_uid: {
          type: SchemaType.STRING,
          description: "The UID of the list to delete"
        }
      },
      required: ["list_uid"]
    }
  },
  {
    name: "create_task",
    description: "Create a new task in a list",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        list_uid: {
          type: SchemaType.STRING,
          description: "The UID of the list to add the task to"
        },
        title: {
          type: SchemaType.STRING,
          description: "The title of the task"
        },
        description: {
          type: SchemaType.STRING,
          description: "The description of the task. Optional."
        },
        priority: {
          type: SchemaType.STRING,
          description: "The priority of the task (low, medium, high)"
        },
        status: {
          type: SchemaType.STRING,
          description: "The status of the task (todo, in_progress, completed)"
        },
        color: {
          type: SchemaType.STRING,
          description: "The color of the task in hex format. Optional."
        },
        due_date: {
          type: SchemaType.STRING,
          description: "The due date of the task in ISO format (YYYY-MM-DD). Optional."
        }
      },
      required: ["list_uid", "title"]
    }
  },
  {
    name: "update_task",
    description: "Update an existing task",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        task_uid: {
          type: SchemaType.STRING,
          description: "The UID of the task to update"
        },
        title: {
          type: SchemaType.STRING,
          description: "The new title for the task. Optional."
        },
        description: {
          type: SchemaType.STRING,
          description: "The new description for the task. Optional."
        },
        priority: {
          type: SchemaType.STRING,
          description: "The new priority for the task (low, medium, high). Optional."
        },
        status: {
          type: SchemaType.STRING,
          description: "The new status for the task (todo, in_progress, completed). Optional."
        },
        color: {
          type: SchemaType.STRING,
          description: "The new color for the task in hex format. Optional."
        },
        due_date: {
          type: SchemaType.STRING,
          description: "The new due date of the task in ISO format (YYYY-MM-DD). Optional. Use null to remove due date."
        },
        is_completed: {
          type: SchemaType.BOOLEAN,
          description: "Whether the task is completed. Optional."
        }
      },
      required: ["task_uid"]
    }
  },
  {
    name: "delete_task",
    description: "Delete a task",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        task_uid: {
          type: SchemaType.STRING,
          description: "The UID of the task to delete"
        }
      },
      required: ["task_uid"]
    }
  },
  {
    name: "move_task",
    description: "Move a task from one list to another",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        task_uid: {
          type: SchemaType.STRING,
          description: "The UID of the task to move"
        },
        target_list_uid: {
          type: SchemaType.STRING,
          description: "The UID of the list to move the task to"
        },
        position: {
          type: SchemaType.NUMBER,
          description: "The position in the target list. Optional."
        }
      },
      required: ["task_uid", "target_list_uid"]
    }
  },
  {
    name: "get_project_data",
    description: "Get current project data including all lists and tasks for context",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  }
];

// System prompt for the AI with function calling capabilities
export const FUNCTION_CALLING_SYSTEM_PROMPT = `You are ProjectNest AI Assistant. You help users manage their project lists and tasks using natural language.

AVAILABLE FUNCTIONS:
- create_list(name, color?, position?) → Creates a new list
- update_list(list_uid, name?, color?, position?) → Updates a list
- delete_list(list_uid) → Deletes a list
- create_task(list_uid, title, description?, priority?, status?, color?, due_date?) → Creates a task in a list
- update_task(task_uid, title?, description?, status?, priority?, due_date?) → Updates a task
- delete_task(task_uid) → Deletes a task
- move_task(from_list_uid, to_list_uid, task_uid, new_position?) → Moves a task between lists
- get_project_data() → Gets current project state (lists and tasks)

CONTEXT AWARENESS:
- At the start of each session, you receive the current project state with all lists and their tasks
- You know which lists exist and their UIDs
- You know which tasks exist in each list
- Use this context to intelligently resolve user requests

TASK CREATION RULES:
1. If user says "add a task" without specifying a list:
   - Look at the existing lists from the context
   - If there's only one list, use that list
   - If there are multiple lists, ask which list or intelligently choose based on task name
   
2. If user says "add a task to [list name]":
   - Find the list_uid from the context using the list name
   - Create the task in that list

3. If user mentions creating a task for a list that doesn't exist:
   - First create the list, then create the task in it

4. Extract task details intelligently:
   - Priority: Look for words like "urgent", "important" (high), "low priority" (low), default to "medium"
   - Status: Default to "todo" unless specified
   - Description: Include any additional context the user provides

DECISION LOGIC:
- CREATE operations (new lists/tasks) → Call create function DIRECTLY with context
- UPDATE operations → Use context to find UID, then call update function
- DELETE operations → Use context to find UID, then call delete function
- READ operations → Only call get_project_data if you need fresh data

RESPONSE STYLE:
- Be concise and friendly
- Confirm what was done
- If clarification is needed, ask a simple question

EXAMPLES:

Scenario: User has lists ["Backend Tasks" (UID: "abc123"), "Frontend Tasks" (UID: "def456")]

User: "Create a list called Testing"
→ create_list(name="Testing", color="#10B981")
✅ "Created 'Testing' list!"

User: "Add a task to implement user authentication"
→ create_task(list_uid="abc123", title="Implement user authentication", status="todo", priority="high")
✅ "Added 'Implement user authentication' to Backend Tasks!"

User: "Add a task to fix the login bug in Frontend Tasks"
→ create_task(list_uid="def456", title="Fix login bug", status="todo", priority="high")
✅ "Added 'Fix login bug' to Frontend Tasks!"

User: "Create an urgent task for API documentation"
→ create_task(list_uid="abc123", title="API documentation", status="todo", priority="high")
✅ "Added urgent task 'API documentation' to Backend Tasks!"

User: "Show me all my lists"
→ get_project_data()
✅ "You have 3 lists: Backend Tasks (2 tasks), Frontend Tasks (1 task), Testing (0 tasks)"

DEFAULT VALUES:
- List color: "#3B82F6" (blue)
- Task status: "todo"
- Task priority: "medium"
- Task color: "#6B7280" (gray)

Remember: Use the context provided at session start to make intelligent decisions about where to create tasks!`;