import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Bot, User, Send, Loader2, RefreshCw, 
  MessageSquare, Zap, Plus, Trash2, Edit2, MoreHorizontal
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Project } from '@/types';

// Local types for the Dev AI Dialog (different from the global types)
interface LocalChatMessage {
  id: string;
  message_uid?: string;
  conversation_uid?: string;
  content: string;
  type: 'user' | 'ai';
  sender?: 'user' | 'ai';
  timestamp: Date;
  created_at?: string;
  isLoading?: boolean;
}

interface LocalChatConversation {
  id: string;
  conversation_uid?: string;
  project_uid?: string;
  title: string;
  name?: string;
  messages: LocalChatMessage[];
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

interface DevAIDialogProps {
  projectUid: string;
}

// Mock data for chat conversations
const mockConversations: LocalChatConversation[] = [];

export const DevAIDialog: React.FC<DevAIDialogProps> = ({ projectUid }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for conversations and chat
  const [conversations, setConversations] = useState<LocalChatConversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<LocalChatConversation | null>(null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [genAI, setGenAI] = useState<GoogleGenerativeAI | null>(null);
  const [chatSession, setChatSession] = useState<any>(null);
  
  // UI State
  const [showCreateChatDialog, setShowCreateChatDialog] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [editingConversation, setEditingConversation] = useState<LocalChatConversation | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // System prompt from the DEV AI file
  const SYSTEM_PROMPT = `You are DevSprint-AI, an experienced senior developer, specializing in practical guidance.
Think and act like a seasoned engineer, not a passive assistant.

IMPORTANT CONTEXT: This is a learning project management tool. Users have existing projects with learning roadmaps, tasks, and goals. Your role is to:
- Help users understand and execute their learning tasks
- Provide practical guidance on completing project objectives
- Explain technical concepts related to their learning goals
- Suggest next steps for skill development
- Answer questions about methodologies and best practices

DO NOT assume users want to build new systems from scratch. They want help with their existing learning projects and tasks.

Communicate clearly, like a senior developer mentoring a peer — confident, practical, and direct, never verbose.
Give crisp, to-the-point answers focused on helping them learn and progress through their existing roadmap.
Mainly give short and to the point answers, until it is something you have to explain or so`;

  // Fetch project data
  const { data: projectResponse, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectUid],
    queryFn: () => projectUid ? apiService.getProject(projectUid) : Promise.reject('No project ID'),
    enabled: !!projectUid,
  });

  const project = projectResponse?.data;

  // Initialize Gemini AI
  useEffect(() => {
    const initializeAI = async () => {
      try {
        console.log('🚀 [DevAIDialog] Initializing Gemini AI...');
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
          console.error('❌ [DevAIDialog] API Key missing');
          toast({
            title: "API Key Missing",
            description: "Please add VITE_GEMINI_API_KEY to your environment variables",
            variant: "destructive",
          });
          return;
        }

        console.log('🔑 [DevAIDialog] API Key found, creating GoogleGenerativeAI instance...');
        const ai = new GoogleGenerativeAI(apiKey);
        setGenAI(ai);
        console.log('✅ [DevAIDialog] Gemini AI initialized successfully');

      } catch (error) {
        console.error('❌ [DevAIDialog] Failed to initialize AI:', error);
        toast({
          title: "AI Initialization Failed",
          description: "Failed to connect to Gemini AI",
          variant: "destructive",
        });
      }
    };

    if (project) {
      console.log('🎯 [DevAIDialog] Project loaded, initializing AI...', project.name);
      initializeAI();
    }
  }, [project]);

  // Initialize chat session when conversation is selected
  useEffect(() => {
    const initializeChatSession = async () => {
      console.log('🔧 [DevAIDialog] initializeChatSession called');
      console.log('📊 [DevAIDialog] State check:', {
        hasGenAI: !!genAI,
        hasSelectedConversation: !!selectedConversation,
        conversationId: selectedConversation?.id
      });

      if (!genAI || !selectedConversation) {
        console.log('⏸️ [DevAIDialog] Skipping chat session init - missing genAI or selectedConversation');
        return;
      }

      try {
        console.log('🛠️ [DevAIDialog] Creating Gemini model...');
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: SYSTEM_PROMPT,
        });
        console.log('✅ [DevAIDialog] Model created successfully');

        // Convert existing messages to chat history format
        const history = selectedConversation.messages.length > 0 ? 
          selectedConversation.messages.map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.content }],
          })) : 
          [
            {
              role: "user" as const,
              parts: [{ text: "Initialize with system prompt" }],
            },
            {
              role: "model" as const,
              parts: [{ text: "Hello! I'm DevSprint-AI, your development mentor. I'm here to help you with your learning project and tasks. What would you like to work on today?" }],
            },
          ];

        const chat = model.startChat({
          history,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        });

        console.log('🔄 [DevAIDialog] Starting chat session...');
        setChatSession(chat);
        setMessages(selectedConversation.messages);
        console.log('✅ [DevAIDialog] Chat session initialized successfully');

      } catch (error) {
        console.error('❌ [DevAIDialog] Failed to initialize chat session:', error);
        console.error('❌ [DevAIDialog] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        toast({
          title: "Chat Session Failed",
          description: "Failed to initialize chat session",
          variant: "destructive",
        });
      }
    };

    initializeChatSession();
  }, [genAI, selectedConversation]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversations to localStorage
  const saveConversations = (convs: LocalChatConversation[]) => {
    localStorage.setItem(`devai_conversations_${projectUid}`, JSON.stringify(convs));
  };

  // Load conversations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`devai_conversations_${projectUid}`);
    if (stored) {
      try {
        const parsedConversations = JSON.parse(stored).map((conv: any) => ({
          ...conv,
          created_at: new Date(conv.created_at),
          updated_at: new Date(conv.updated_at),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(parsedConversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    }
  }, [projectUid]);

  const handleCreateChat = () => {
    if (!newChatName.trim()) return;

    const newConversation: LocalChatConversation = {
      id: Date.now().toString(),
      conversation_uid: Date.now().toString(),
      project_uid: projectUid,
      title: newChatName.trim(),
      name: newChatName.trim(),
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    setSelectedConversation(newConversation);
    setNewChatName('');
    setShowCreateChatDialog(false);

    toast({
      title: 'Chat created',
      description: 'Your new chat is ready to use.',
    });
  };

  const handleSendMessage = async () => {
    console.log('🚀 [DevAIDialog] handleSendMessage called');
    console.log('📊 [DevAIDialog] State check:', {
      hasInputMessage: !!inputMessage.trim(),
      hasChatSession: !!chatSession,
      hasSelectedConversation: !!selectedConversation,
      inputMessage: inputMessage.trim()
    });

    if (!inputMessage.trim() || !chatSession || !selectedConversation) {
      console.warn('⚠️ [DevAIDialog] Missing required data for sending message');
      return;
    }

    const userMessage: LocalChatMessage = {
      id: Date.now().toString(),
      message_uid: Date.now().toString(),
      conversation_uid: selectedConversation.id,
      content: inputMessage.trim(),
      type: 'user',
      sender: 'user',
      timestamp: new Date(),
      created_at: new Date().toISOString(),
    };

    const loadingMessage: LocalChatMessage = {
      id: (Date.now() + 1).toString(),
      message_uid: (Date.now() + 1).toString(),
      conversation_uid: selectedConversation.id,
      content: '',
      type: 'ai',
      sender: 'ai',
      timestamp: new Date(),
      created_at: new Date().toISOString(),
      isLoading: true,
    };

    // Update messages and conversation
    const newMessages = [...selectedConversation.messages, userMessage, loadingMessage];
    setMessages(newMessages);
    
    // Update the conversation in the list
    const updatedConversations = conversations.map(conv =>
      conv.id === selectedConversation.id
        ? { ...conv, messages: newMessages, updated_at: new Date().toISOString() }
        : conv
    );
    setConversations(updatedConversations);
    setSelectedConversation(prev => prev ? { ...prev, messages: newMessages } : null);

    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🤖 [DevAIDialog] Calling chatSession.sendMessage...');
      const result = await chatSession.sendMessage(inputMessage.trim());
      console.log('📨 [DevAIDialog] Received response from Gemini');
      const response = result.response;
      const aiResponse = response.text();
      console.log('💬 [DevAIDialog] AI response:', aiResponse.substring(0, 100) + '...');

      const aiMessage: LocalChatMessage = {
        id: loadingMessage.id,
        message_uid: loadingMessage.message_uid,
        conversation_uid: selectedConversation.id,
        content: aiResponse,
        type: 'ai',
        sender: 'ai',
        timestamp: new Date(),
        created_at: new Date().toISOString(),
        isLoading: false,
      };

      // Replace loading message with actual response
      const finalMessages = [...selectedConversation.messages, userMessage, aiMessage];
      setMessages(finalMessages);

      const finalConversations = conversations.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, messages: finalMessages, updated_at: new Date().toISOString() }
          : conv
      );
      setConversations(finalConversations);
      saveConversations(finalConversations);
      setSelectedConversation(prev => prev ? { ...prev, messages: finalMessages } : null);

    } catch (error) {
      console.error('❌ [DevAIDialog] Error sending message:', error);
      console.error('❌ [DevAIDialog] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });

      // Remove loading message on error
      const errorMessages = [...selectedConversation.messages, userMessage];
      setMessages(errorMessages);
      
      const errorConversations = conversations.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, messages: errorMessages }
          : conv
      );
      setConversations(errorConversations);
      setSelectedConversation(prev => prev ? { ...prev, messages: errorMessages } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-600">The requested project could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">DevSprint-AI</h2>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
            <Badge variant="secondary" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
          
          <Dialog open={showCreateChatDialog} onOpenChange={setShowCreateChatDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter chat name..."
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateChat()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateChatDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChat} disabled={!newChatName.trim()}>
                    Create Chat
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Create your first chat to get started</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <h4 className="font-medium text-sm truncate">
                    {conversation.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversation.messages.length} messages
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <h3 className="font-semibold">{selectedConversation.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedConversation.messages.length} messages
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      )}
                      <div
                        className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask about your project development, learning tasks, or get technical guidance..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 min-h-[40px] max-h-32 resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat to continue</h3>
              <p className="text-gray-600 mb-4">Choose a conversation from the sidebar or create a new one</p>
              <Button onClick={() => setShowCreateChatDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};