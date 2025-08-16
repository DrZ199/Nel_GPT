import { useState, useCallback } from 'react';
import { streamNelsonQuery, processNelsonQuery } from '@/services/ragService';
import { createChatSession, ChatSession, ChatMessage } from '@/lib/supabase';
import { MistralMessage } from '@/services/mistralService';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  citations?: Array<{
    chapter: string;
    section: string;
    page?: string;
    edition: string;
  }>;
  confidence?: 'high' | 'medium' | 'low';
}

export interface UseChatOptions {
  enableStreaming?: boolean;
  maxMessages?: number;
  autoSave?: boolean;
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentSession: ChatSession | null;
  sendMessage: (content: string) => Promise<void>;
  createNewSession: (title?: string) => Promise<void>;
  clearMessages: () => void;
  regenerateLastResponse: () => Promise<void>;
  copyMessage: (messageId: string) => void;
  setMessages: (messages: Message[]) => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    enableStreaming = true,
    maxMessages = 50,
    autoSave = true,
    sessionId,
    onSessionCreated
  } = options;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# Welcome to Nelson-GPT 🩺

I'm your pediatric medical AI assistant, powered by the **Nelson Textbook of Pediatrics (22nd Edition)**.

## How I Can Help:
- **Evidence-based answers** to pediatric medical questions
- **Diagnostic guidance** with differential considerations  
- **Treatment protocols** based on current guidelines
- **Drug dosing** calculations for pediatric patients
- **Emergency protocols** (NRP, PALS, BLS)

## Important Notes:
⚠️ **For healthcare professionals only** - not for patient care decisions
✅ **All responses include citations** from Nelson Textbook
🔒 **Evidence-based only** - I won't speculate beyond the literature

**What pediatric question can I help you with today?**`,
      timestamp: new Date(),
      confidence: 'high',
      citations: [
        {
          chapter: 'Introduction',
          section: 'Scope of Pediatric Medicine',
          edition: '22nd Edition',
        },
      ],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([messages[0]]); // Keep welcome message
    setCurrentSession(null);
    setError(null);
  }, [messages]);

  const createNewSession = useCallback(async (title?: string) => {
    try {
      const sessionTitle = title || `Medical Consultation - ${new Date().toLocaleDateString()}`;
      const session = await createChatSession(sessionTitle);
      setCurrentSession(session);
      clearMessages();
      if (onSessionCreated) {
        onSessionCreated(session.id);
      }
      toast.success('New consultation session created');
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Failed to create new session');
    }
  }, [clearMessages, onSessionCreated]);

  const buildConversationHistory = useCallback((): MistralMessage[] => {
    return messages
      .filter(msg => msg.id !== 'welcome') // Exclude welcome message
      .slice(-6) // Keep last 6 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);

    try {
      const conversationHistory = buildConversationHistory();
      const sessionId = currentSession?.id;

      if (enableStreaming) {
        // Streaming response
        const streamingMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        // Add empty streaming message
        setMessages(prev => [...prev, streamingMessage]);

        const responseGenerator = streamNelsonQuery(
          content,
          sessionId,
          conversationHistory
        );

        let fullContent = '';
        let finalResponse: any = null;

        for await (const chunk of responseGenerator) {
          if (typeof chunk === 'string') {
            fullContent += chunk;
            
            // Update the streaming message with accumulated content
            setMessages(prev => 
              prev.map(msg => 
                msg.id === streamingMessage.id 
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          } else {
            finalResponse = chunk;
          }
        }

        // Final update with complete message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === streamingMessage.id
              ? {
                  ...msg,
                  content: finalResponse?.content || fullContent,
                  isStreaming: false,
                  citations: finalResponse?.citations,
                  confidence: finalResponse?.confidence,
                }
              : msg
          )
        );

      } else {
        // Non-streaming response
        const response = await processNelsonQuery(
          content,
          sessionId,
          conversationHistory
        );

        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          citations: response.citations,
          confidence: response.confidence,
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

      // Auto-create session if none exists
      if (!currentSession && autoSave) {
        try {
          const sessionTitle = content.length > 50 
            ? content.substring(0, 47) + '...' 
            : content;
          await createNewSession(sessionTitle);
        } catch (err) {
          console.error('Failed to auto-create session:', err);
        }
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      const errorAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}

Please try:
- Rephrasing your question
- Checking your internet connection
- Starting a new conversation if the issue persists`,
        timestamp: new Date(),
        confidence: 'low',
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentSession, enableStreaming, autoSave, buildConversationHistory, createNewSession]);

  const regenerateLastResponse = useCallback(async () => {
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'user');

    if (!lastUserMessage) {
      toast.error('No user message found to regenerate response');
      return;
    }

    // Remove the last assistant message
    setMessages(prev => 
      prev.filter((_, index) => 
        index !== prev.length - 1 || prev[prev.length - 1].role !== 'assistant'
      )
    );

    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  const copyMessage = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    currentSession,
    sendMessage,
    createNewSession,
    clearMessages,
    regenerateLastResponse,
    copyMessage,
    setMessages,
  };
}