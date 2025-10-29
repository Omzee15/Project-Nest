import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiService } from './api';
import { FUNCTION_SCHEMAS, FUNCTION_CALLING_SYSTEM_PROMPT, FunctionCallResult } from './aiFunction';
import { ListRequest, ListUpdateRequest, TaskRequest, TaskUpdateRequest, ProjectWithLists } from '@/types';
import { toast } from '@/hooks/use-toast';

export interface AIMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  functionCalls?: FunctionCall[];
  functionResults?: FunctionCallResult[];
}

// This matches what Gemini actually returns
export interface FunctionCall {
  name: string;
  args: any;  // Gemini uses 'args', not 'parameters'
}

export class EnhancedAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private projectUid: string;
  private currentProjectData: ProjectWithLists | null = null;
  private chatHistory: any[] = [];
  private chat: any = null;

  constructor(projectUid: string) {
    console.log('🏗️ [EnhancedAI] Constructor called with projectUid:', projectUid);
    this.projectUid = projectUid;
    this.initializeAI();
  }

  // Initialize chat session with project context
  async initializeSession(): Promise<void> {
    console.log('🔄 [EnhancedAI] Initializing chat session with project context...');
    
    // Fetch current project data
    const result = await this.getProjectData();
    
    if (result.success && result.data) {
      const { lists, tasks } = result.data;
      
      // Create context message
      const contextMessage = this.buildContextMessage(lists, tasks);
      console.log('📋 [EnhancedAI] Context message:', contextMessage);
      
      // Initialize chat with context in history
      this.chatHistory = [
        {
          role: 'user',
          parts: [{ text: contextMessage }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand the current project structure. I can help you create lists and tasks, update them, or answer questions about the project.' }]
        }
      ];
      
      console.log('✅ [EnhancedAI] Chat session initialized with project context');
    }
  }

  private buildContextMessage(lists: any[], tasks: any[]): string {
    let message = "Here is the current state of the project:\n\n";
    
    if (lists.length === 0) {
      message += "No lists exist yet.\n";
    } else {
      message += `Lists (${lists.length} total):\n`;
      lists.forEach((list: any) => {
        const listTasks = tasks.filter((t: any) => t.list_uid === list.list_uid);
        message += `- "${list.name}" (UID: ${list.list_uid}, Color: ${list.color}, ${listTasks.length} tasks)\n`;
        
        if (listTasks.length > 0) {
          listTasks.forEach((task: any) => {
            message += `  • "${task.title}" (UID: ${task.task_uid}, Status: ${task.status}, Priority: ${task.priority})\n`;
          });
        }
      });
    }
    
    message += "\nYou can help me create new lists and tasks, update existing ones, or answer questions about the project.";
    return message;
  }

  private async initializeAI() {
    console.log('🚀 [EnhancedAI] initializeAI started');
    try {
      console.log('🔑 [EnhancedAI] Checking for VITE_GEMINI_API_KEY...');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('🔑 [EnhancedAI] API Key exists:', !!apiKey);
      console.log('🔑 [EnhancedAI] API Key length:', apiKey?.length || 0);
      
      if (!apiKey) {
        console.error('❌ [EnhancedAI] No API key found in environment');
        throw new Error('Gemini API key not found');
      }

      console.log('📦 [EnhancedAI] Creating GoogleGenerativeAI instance...');
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ [EnhancedAI] GoogleGenerativeAI instance created');
      
      console.log('🤖 [EnhancedAI] Getting generative model...');
      console.log('📋 [EnhancedAI] Number of function schemas:', FUNCTION_SCHEMAS.length);
      
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: FUNCTION_CALLING_SYSTEM_PROMPT,
        tools: [{
          functionDeclarations: FUNCTION_SCHEMAS as any
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });
      console.log('✅ [EnhancedAI] Generative model created');

      console.log('✅ [EnhancedAI] Enhanced AI Service initialized successfully');
    } catch (error) {
      console.error('❌ [EnhancedAI] Failed to initialize Enhanced AI Service:', error);
      console.error('❌ [EnhancedAI] Error details:', error instanceof Error ? error.message : error);
      console.error('❌ [EnhancedAI] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  async sendMessage(message: string): Promise<AIMessage> {
    console.log('📨 [EnhancedAI] sendMessage called with:', message);
    
    if (!this.model) {
      console.error('❌ [EnhancedAI] Model not initialized');
      throw new Error('AI model not initialized');
    }

    try {
      // Create or reuse chat session with history
      if (!this.chat) {
        console.log('📝 [EnhancedAI] Creating new chat session with history...');
        this.chat = this.model.startChat({
          history: this.chatHistory
        });
        console.log('✅ [EnhancedAI] Chat session created with', this.chatHistory.length, 'history items');
      }

      // Send message
      console.log('📤 [EnhancedAI] Sending message to AI...');
      const result = await this.chat.sendMessage(message);
      console.log('✅ [EnhancedAI] Message sent, getting response...');
      
      const response = result.response;
      console.log('✅ [EnhancedAI] Response received');
      console.log('📤 [EnhancedAI] Raw response:', JSON.stringify(response, null, 2));

      // Check if response has function calls
      let functionCalls: FunctionCall[] = [];
      try {
        console.log('🔍 [EnhancedAI] Checking for function calls...');
        const rawFunctionCalls = response.functionCalls();
        console.log('🔧 [EnhancedAI] Raw function calls:', rawFunctionCalls);
        
        if (rawFunctionCalls && rawFunctionCalls.length > 0) {
          functionCalls = rawFunctionCalls;
          console.log('🔧 [EnhancedAI] Function calls found:', functionCalls.length);
          
          // Log each function call structure in detail
          functionCalls.forEach((fc, idx) => {
            console.log(`\n🔍 [EnhancedAI] === Function Call ${idx} ===`);
            console.log(`🔍 [EnhancedAI] name:`, fc.name);
            console.log(`🔍 [EnhancedAI] args:`, fc.args);
            console.log(`🔍 [EnhancedAI] Full:`, JSON.stringify(fc, null, 2));
          });
        }
      } catch (e) {
        console.log('⚠️ [EnhancedAI] No function calls or error getting them:', e);
      }
      
      let functionResults: FunctionCallResult[] = [];
      let finalContent = '';

      if (functionCalls && functionCalls.length > 0) {
        console.log('🔧 [EnhancedAI] Function calls detected:', functionCalls.length, 'calls');
        
        // Execute function calls sequentially
        for (let i = 0; i < functionCalls.length; i++) {
          const functionCall = functionCalls[i];
          console.log(`🎯 [EnhancedAI] Executing function ${i + 1}/${functionCalls.length}:`, functionCall.name);
          
          try {
            const result = await this.executeFunctionCall(functionCall);
            console.log(`✅ [EnhancedAI] Function ${functionCall.name} completed:`, result);
            functionResults.push(result);
          } catch (error) {
            console.error(`❌ [EnhancedAI] Function ${functionCall.name} failed:`, error);
            functionResults.push({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        // Generate user-friendly response from function results
        finalContent = this.generateResponseFromResults(functionResults, functionCalls);
        console.log('📝 [EnhancedAI] Generated response from function results:', finalContent);
      } else {
        // No function calls, use text response
        finalContent = response.text?.() || '';
        console.log('📝 [EnhancedAI] Using direct text response:', finalContent);
        
        // If still empty, generate a generic response
        if (!finalContent) {
          console.log('⚠️ [EnhancedAI] Empty content, generating fallback response');
          finalContent = 'I processed your request. Let me know if you need anything else!';
        }
      }

      console.log('✅ [EnhancedAI] Final message content:', finalContent);
      
      return {
        id: Date.now().toString(),
        content: finalContent,
        type: 'ai',
        timestamp: new Date(),
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        functionResults: functionResults.length > 0 ? functionResults : undefined
      };
    } catch (error) {
      console.error('❌ [EnhancedAI] Error in sendMessage:', error);
      throw error;
    }
  }

  // Generate a user-friendly response from function results
  private generateResponseFromResults(results: FunctionCallResult[], calls: FunctionCall[]): string {
    console.log('📝 [EnhancedAI] generateResponseFromResults called');
    console.log('📝 [EnhancedAI] Results:', results);
    console.log('📝 [EnhancedAI] Calls:', calls);
    
    let response = '';
    const successOps: string[] = [];
    const failedOps: string[] = [];

    results.forEach((result, index) => {
      const call = calls[index];
      const functionName = call?.name || 'unknown';
      
      if (result.success) {
        // Parse successful operations
        if (functionName === 'create_list' && result.data) {
          successOps.push(`✅ Created list "${result.data.name}"`);
        } else if (functionName === 'create_task' && result.data) {
          successOps.push(`✅ Created task "${result.data.title}"`);
        } else if (functionName === 'update_list') {
          successOps.push(`✅ Updated list`);
        } else if (functionName === 'update_task') {
          successOps.push(`✅ Updated task`);
        } else if (functionName === 'delete_list') {
          successOps.push(`✅ Deleted list`);
        } else if (functionName === 'delete_task') {
          successOps.push(`✅ Deleted task`);
        } else if (functionName === 'move_task') {
          successOps.push(`✅ Moved task`);
        } else if (functionName === 'get_project_data') {
          // Don't add to success ops, just acknowledge
        } else {
          successOps.push(`✅ ${functionName} completed`);
        }
      } else {
        failedOps.push(`${functionName}: ${result.error || 'Unknown error'}`);
      }
    });

    if (successOps.length > 0) {
      response = successOps.join('\n');
    }

    if (failedOps.length > 0) {
      if (response) response += '\n\n';
      response += '❌ Failed operations:\n' + failedOps.map(op => `• ${op}`).join('\n');
    }

    if (!response) {
      response = 'I processed your request but couldn\'t generate a detailed response. Please check if the changes were applied.';
    }

    return response;
  }

  private async executeFunctionCall(functionCall: FunctionCall): Promise<FunctionCallResult> {
    console.log(`🚀 [EnhancedAI] executeFunctionCall: ${functionCall.name}`);
    console.log(`📋 [EnhancedAI] Function call args:`, functionCall.args);

    try {
      let result: FunctionCallResult;
      
      switch (functionCall.name) {
        case 'get_project_data':
          console.log('📊 [EnhancedAI] Calling getProjectData...');
          result = await this.getProjectData();
          console.log('✅ [EnhancedAI] getProjectData completed:', result);
          return result;
        
        case 'create_list':
          console.log('📝 [EnhancedAI] Calling createList with args:', functionCall.args);
          result = await this.createList(functionCall.args);
          console.log('✅ [EnhancedAI] createList completed:', result);
          return result;
        
        case 'update_list':
          console.log('✏️ [EnhancedAI] Calling updateList...');
          result = await this.updateList(functionCall.args);
          console.log('✅ [EnhancedAI] updateList completed:', result);
          return result;
        
        case 'delete_list':
          console.log('🗑️ [EnhancedAI] Calling deleteList...');
          result = await this.deleteList(functionCall.args);
          console.log('✅ [EnhancedAI] deleteList completed:', result);
          return result;
        
        case 'create_task':
          console.log('📝 [EnhancedAI] Calling createTask...');
          result = await this.createTask(functionCall.args);
          console.log('✅ [EnhancedAI] createTask completed:', result);
          return result;
        
        case 'update_task':
          console.log('✏️ [EnhancedAI] Calling updateTask...');
          result = await this.updateTask(functionCall.args);
          console.log('✅ [EnhancedAI] updateTask completed:', result);
          return result;
        
        case 'delete_task':
          console.log('🗑️ [EnhancedAI] Calling deleteTask...');
          result = await this.deleteTask(functionCall.args);
          console.log('✅ [EnhancedAI] deleteTask completed:', result);
          return result;
        
        case 'move_task':
          console.log('🔄 [EnhancedAI] Calling moveTask...');
          result = await this.moveTask(functionCall.args);
          console.log('✅ [EnhancedAI] moveTask completed:', result);
          return result;
        
        default:
          console.error(`❌ [EnhancedAI] Unknown function: ${functionCall.name}`);
          return {
            success: false,
            error: `Unknown function: ${functionCall.name}`
          };
      }
    } catch (error) {
      console.error(`❌ [EnhancedAI] Error executing ${functionCall.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Function implementations
  private async getProjectData(): Promise<FunctionCallResult> {
    console.log('📊 [EnhancedAI] getProjectData - Fetching project data for:', this.projectUid);
    
    try {
      const response = await apiService.getProject(this.projectUid);
      console.log('✅ [EnhancedAI] getProjectData - Project data fetched:', response);
      
      // API returns ApiResponse<ProjectWithLists>, extract the data
      const projectData = response.data!;
      this.currentProjectData = projectData;
      
      return {
        success: true,
        data: {
          project: projectData,
          lists: projectData.lists,
          tasks: projectData.lists.flatMap(list => list.tasks || [])
        }
      };
    } catch (error) {
      console.error('❌ [EnhancedAI] getProjectData - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project data'
      };
    }
  }

  private async createList(params: any): Promise<FunctionCallResult> {
    console.log('📝 [EnhancedAI] createList - Entry point');
    console.log('📝 [EnhancedAI] createList - Params:', params);
    console.log('📝 [EnhancedAI] createList - Params type:', typeof params);
    console.log('📝 [EnhancedAI] createList - Params keys:', params ? Object.keys(params) : 'null');
    
    try {
      if (!params || typeof params !== 'object') {
        console.error('❌ [EnhancedAI] Invalid params object:', params);
        return {
          success: false,
          error: 'Invalid parameters for creating list'
        };
      }
      
      const { name, color } = params;
      console.log('📝 [EnhancedAI] createList - Extracted:', { name, color });
      
      if (!name) {
        console.error('❌ [EnhancedAI] Missing required field: name');
        return {
          success: false,
          error: 'List name is required'
        };
      }

      console.log('📝 [EnhancedAI] createList - Creating list with:', { name, color });
      
      const listRequest: ListRequest = {
        project_uid: this.projectUid,
        name,
        color: color || '#3B82F6',
        position: params.position || 0
      };
      
      console.log('📝 [EnhancedAI] createList - List request:', listRequest);
      console.log('📝 [EnhancedAI] createList - Calling API...');
      
      const response = await apiService.createList(listRequest);
      const newList = response.data!;
      console.log('✅ [EnhancedAI] createList - List created:', newList);
      
      toast({
        title: "List created",
        description: `Created list "${newList.name}"`,
      });
      
      return {
        success: true,
        data: newList
      };
    } catch (error) {
      console.error('❌ [EnhancedAI] createList - Error:', error);
      console.error('❌ [EnhancedAI] createList - Error type:', typeof error);
      console.error('❌ [EnhancedAI] createList - Error message:', error instanceof Error ? error.message : String(error));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create list',
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create list'
      };
    }
  }

  private async updateList(params: any): Promise<FunctionCallResult> {
    try {
      const { list_uid, name, color } = params;
      
      if (!list_uid) {
        return {
          success: false,
          error: 'List UID is required'
        };
      }

      const listRequest: Partial<ListUpdateRequest> = {};
      if (name !== undefined) listRequest.name = name;
      if (color !== undefined) listRequest.color = color;
      
      await apiService.partialUpdateList(list_uid, listRequest);
      
      toast({
        title: "List updated",
        description: "List has been updated successfully",
      });
      
      return {
        success: true
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update list",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update list'
      };
    }
  }

  private async deleteList(params: any): Promise<FunctionCallResult> {
    try {
      const { list_uid } = params;
      
      if (!list_uid) {
        return {
          success: false,
          error: 'List UID is required'
        };
      }
      
      await apiService.deleteList(list_uid);
      
      toast({
        title: "List deleted",
        description: "List has been deleted successfully",
      });
      
      return {
        success: true
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete list",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete list'
      };
    }
  }

  private async createTask(params: any): Promise<FunctionCallResult> {
    try {
      const { list_uid, title, description, priority, due_date, status } = params;
      
      if (!list_uid || !title) {
        return {
          success: false,
          error: 'List UID and task title are required'
        };
      }

      const taskRequest: TaskRequest = {
        list_uid,
        title,
        description: description || '',
        status: status || 'todo', // Changed from 'pending' to 'todo'
        priority: priority || 'medium',
        due_date: due_date || undefined,
        position: params.position || 0
      };
      
      const response = await apiService.createTask(taskRequest);
      const newTask = response.data!;
      
      toast({
        title: "Task created",
        description: `Created task "${newTask.title}"`,
      });
      
      return {
        success: true,
        data: newTask
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task'
      };
    }
  }

  private async updateTask(params: any): Promise<FunctionCallResult> {
    try {
      const { task_uid, title, description, status, priority, due_date } = params;
      
      if (!task_uid) {
        return {
          success: false,
          error: 'Task UID is required'
        };
      }

      const taskRequest: Partial<TaskUpdateRequest> = {};
      if (title !== undefined) taskRequest.title = title;
      if (description !== undefined) taskRequest.description = description;
      if (status !== undefined) taskRequest.status = status;
      if (priority !== undefined) taskRequest.priority = priority;
      if (due_date !== undefined) taskRequest.due_date = due_date;
      
      await apiService.partialUpdateTask(task_uid, taskRequest);
      
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
      
      return {
        success: true
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task'
      };
    }
  }

  private async deleteTask(params: any): Promise<FunctionCallResult> {
    try {
      const { task_uid } = params;
      
      if (!task_uid) {
        return {
          success: false,
          error: 'Task UID is required'
        };
      }
      
      await apiService.deleteTask(task_uid);
      
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
      
      return {
        success: true
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      };
    }
  }

  private async moveTask(params: any): Promise<FunctionCallResult> {
    try {
      const { from_list_uid, to_list_uid, task_uid, new_position } = params;
      
      if (!from_list_uid || !to_list_uid || !task_uid) {
        return {
          success: false,
          error: 'From list UID, To list UID, and Task UID are required'
        };
      }
      
      // Get the task first
      const response = await apiService.getProject(this.projectUid);
      const project = response.data!;
      const fromList = project.lists.find(l => l.list_uid === from_list_uid);
      const task = fromList?.tasks?.find(t => t.task_uid === task_uid);
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        };
      }
      
      // Delete from old list and create in new list
      await apiService.deleteTask(task_uid);
      await apiService.createTask({
        list_uid: to_list_uid,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        color: task.color,
        position: new_position || 0,
        is_completed: task.is_completed,
        due_date: task.due_date
      });
      
      toast({
        title: "Task moved",
        description: "Task has been moved successfully",
      });
      
      return {
        success: true
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to move task'
      };
    }
  }
}
