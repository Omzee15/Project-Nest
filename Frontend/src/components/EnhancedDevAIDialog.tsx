import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bot, User, Send, Loader2, MessageSquare, Zap
} from 'lucide-react';
import { EnhancedAIService, AIMessage } from '@/services/enhancedAI';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface EnhancedDevAIDialogProps {
  projectUid: string;
}

export const EnhancedDevAIDialog: React.FC<EnhancedDevAIDialogProps> = ({ projectUid }) => {
  const queryClient = useQueryClient();
  
  // State
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiService, setAiService] = useState<EnhancedAIService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate user-friendly response from function results
  const generateUserFriendlyResponse = (results: any[]): string => {
    console.log('🔨 [EnhancedDevAIDialog] Generating user-friendly response from results:', results);
    
    const successfulOps: string[] = [];
    const failedOps: string[] = [];

    results.forEach((result) => {
      if (result.success) {
        if (result.message) {
          successfulOps.push(result.message);
        }
      } else {
        if (result.error) {
          failedOps.push(result.error);
        }
      }
    });

    let response = '';
    if (successfulOps.length > 0) {
      response = '✅ ' + successfulOps.join('\n✅ ');
    }

    if (failedOps.length > 0) {
      if (response) response += '\n\n';
      response += '❌ ' + failedOps.join('\n❌ ');
    }

    if (!response) {
      response = '✅ Operation completed successfully!';
    }

    return response;
  };

  // Initialize AI service
  useEffect(() => {
    console.log('🔧 [EnhancedDevAIDialog] Initialize effect triggered, projectUid:', projectUid);
    
    if (projectUid) {
      try {
        console.log('🚀 [EnhancedDevAIDialog] Creating EnhancedAIService...');
        const service = new EnhancedAIService(projectUid);
        console.log('✅ [EnhancedDevAIDialog] EnhancedAIService created');
        setAiService(service);
        
        // Add welcome message
        const welcomeMessage: AIMessage = {
          id: Date.now().toString(),
          content: "Hello! I'm your ProjectNest AI assistant. I can help you create, update, and manage your lists and tasks using natural language. Just tell me what you'd like to do!\n\nFor example:\n• \"Create a new list called 'Frontend Tasks'\"\n• \"Add a task to implement user login\"\n• \"Mark the API task as completed\"\n• \"Move the bug fix task to the done list\"",
          type: 'ai',
          timestamp: new Date(),
        };
        
        console.log('💬 [EnhancedDevAIDialog] Setting welcome message');
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('❌ [EnhancedDevAIDialog] Failed to initialize AI service:', error);
        console.error('❌ [EnhancedDevAIDialog] Error details:', error instanceof Error ? error.message : error);
        toast({
          title: "AI Service Error",
          description: "Failed to initialize AI service. Please check your API configuration.",
          variant: "destructive",
        });
      }
    } else {
      console.warn('⚠️ [EnhancedDevAIDialog] No projectUid provided');
    }
  }, [projectUid]);

  // Initialize session when dialog opens
  useEffect(() => {
    if (isDialogOpen && aiService) {
      console.log('🔄 [EnhancedDevAIDialog] Dialog opened, initializing session with context...');
      aiService.initializeSession().then(() => {
        console.log('✅ [EnhancedDevAIDialog] Session initialized with project context');
        toast({
          title: "AI Ready",
          description: "Loaded current project context",
        });
      }).catch((error) => {
        console.error('❌ [EnhancedDevAIDialog] Failed to initialize session:', error);
      });
    }
  }, [isDialogOpen, aiService]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    console.log('🎯 [EnhancedDevAIDialog] handleSendMessage called');
    console.log('📊 [EnhancedDevAIDialog] State:', {
      hasInput: !!inputMessage.trim(),
      hasService: !!aiService,
      isLoading,
      inputMessage: inputMessage.trim()
    });
    
    if (!inputMessage.trim() || !aiService || isLoading) {
      console.warn('⚠️ [EnhancedDevAIDialog] Message send blocked');
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      type: 'user',
      timestamp: new Date(),
    };

    const loadingMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      type: 'ai',
      timestamp: new Date(),
    };

    console.log('💬 [EnhancedDevAIDialog] User message:', userMessage);
    console.log('⏳ [EnhancedDevAIDialog] Adding loading message');

    // Add user message and loading indicator
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🚀 [EnhancedDevAIDialog] Calling aiService.sendMessage...');
      
      // Add timeout to the entire operation
      const messageTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message processing timeout after 30 seconds')), 30000);
      });
      
      const messagePromise = aiService.sendMessage(userMessage.content);
      
      const aiResponse = await Promise.race([messagePromise, messageTimeout]) as AIMessage;
      console.log('✅ [EnhancedDevAIDialog] AI response received:', aiResponse);
      
      // Check if response has content, if not use function results
      if (!aiResponse.content && aiResponse.functionResults && aiResponse.functionResults.length > 0) {
        console.log('⚠️ [EnhancedDevAIDialog] AI response has no content, generating from function results');
        aiResponse.content = generateUserFriendlyResponse(aiResponse.functionResults);
      }
      
      // If still no content, provide default message
      if (!aiResponse.content) {
        console.log('⚠️ [EnhancedDevAIDialog] Still no content, using default message');
        aiResponse.content = 'I processed your request. Please check if the changes were applied.';
      }
      
      console.log('📝 [EnhancedDevAIDialog] Final AI response content:', aiResponse.content);
      
      // Replace loading message with actual response
      console.log('🔄 [EnhancedDevAIDialog] Replacing loading message with response');
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id ? aiResponse : msg
      ));

      // Refresh project data in React Query cache after successful operations
      if (aiResponse.functionResults && aiResponse.functionResults.some(result => result.success)) {
        console.log('🔄 [EnhancedDevAIDialog] Invalidating project query cache');
        queryClient.invalidateQueries({ queryKey: ['project', projectUid] });
      }

    } catch (error) {
      console.error('❌ [EnhancedDevAIDialog] Error sending message:', error);
      console.error('❌ [EnhancedDevAIDialog] Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 2).toString(),
        content: error instanceof Error && error.message.includes('timeout') 
          ? 'Sorry, the request took too long to process. The operation might have completed - please check your lists and tasks. If not, please try again with a simpler request.'
          : 'Sorry, I encountered an error while processing your request. Please try again.',
        type: 'ai',
        timestamp: new Date(),
      };

      console.log('🔄 [EnhancedDevAIDialog] Replacing loading message with error');
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id ? errorMessage : msg
      ));

      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to process your request.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 [EnhancedDevAIDialog] Message handling complete, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple formatting for better readability
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
          onClick={() => setIsDialogOpen(true)}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" aria-describedby="ai-assistant-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            ProjectNest AI Assistant
            <span className="text-sm font-normal text-muted-foreground">
              Natural Language List & Task Management
            </span>
          </DialogTitle>
          <p id="ai-assistant-description" className="sr-only">
            AI assistant for managing project lists and tasks using natural language commands
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 border rounded-lg">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content ? (
                      <div className="text-sm">
                        {formatMessageContent(message.content)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing your request...</span>
                      </div>
                    )}
                    
                    {/* Show function calls if any */}
                    {message.functionCalls && message.functionCalls.length > 0 && (
                      <div className="mt-2 text-xs opacity-70">
                        <div className="font-medium">Actions taken:</div>
                        <ul className="list-disc list-inside">
                          {message.functionCalls.map((call, index) => (
                            <li key={index}>
                              {call.name.replace('_', ' ')}: {JSON.stringify(call.parameters)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex gap-2 p-4 border-t">
            <Input
              placeholder="Ask me to create lists, add tasks, or manage your project..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Try these examples:</div>
          <div className="flex flex-wrap gap-2">
            {[
              "Create a new list called 'Backend Tasks'",
              "Add a task to implement user authentication",
              "Mark the API integration task as completed",
              "Move the bug fix task to the done list"
            ].map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInputMessage(example)}
                disabled={isLoading}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};