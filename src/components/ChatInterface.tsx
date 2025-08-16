"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Stethoscope,
  Brain,
  Clock,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { useChat } from "@/hooks/useChat";
import toast from "react-hot-toast";

interface ChatInterfaceProps {
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function ChatInterface({ sessionId, onSessionCreated }: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    createNewSession,
    regenerateLastResponse,
    copyMessage,
  } = useChat({ enableStreaming: true, sessionId, onSessionCreated });
  
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const exampleQuestions = [
    "What is the first-line management for Kawasaki disease?",
    "How do I interpret growth charts for a 2-year-old?",
    "What are the contraindications for MMR vaccine?",
    "Calculate amoxicillin dosing for a 15kg child with otitis media",
  ];

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    setInputValue("");
    await sendMessage(content);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = async () => {
    await createNewSession();
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case "high": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getConfidenceIcon = (confidence?: string) => {
    switch (confidence) {
      case "high": return CheckCircle;
      case "medium": return AlertTriangle;
      case "low": return AlertTriangle;
      default: return Brain;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Message Header */}
              <div className="flex items-center gap-2">
                {message.role === "user" ? (
                  <>
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      U
                    </div>
                    <span className="font-medium">You</span>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-primary">Nelson-GPT</span>
                    {message.confidence && (
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getConfidenceColor(message.confidence))}
                      >
                        {React.createElement(getConfidenceIcon(message.confidence), { className: "h-3 w-3 mr-1" })}
                        {message.confidence} confidence
                      </Badge>
                    )}
                  </>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {/* Message Content */}
              <Card className={cn(
                "p-4",
                message.role === "user" ? "bg-muted/50" : "bg-card"
              )}>
                {message.role === "assistant" ? (
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-xl font-semibold text-primary mb-3" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-primary mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-md font-semibold text-primary mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="mb-3 ml-6 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="list-disc" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                        code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Citations</span>
                    </div>
                    <div className="space-y-1">
                      {message.citations.map((citation, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          <strong>Nelson Textbook of Pediatrics</strong> ({citation.edition}) - 
                          Chapter: {citation.chapter}, Section: {citation.section}
                          {citation.page && `, Pages: ${citation.page}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Actions */}
                {message.role === "assistant" && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.id)}
                        title="Copy message"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toast.success('Feedback recorded')}
                        title="Helpful response"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toast.success('Feedback recorded')}
                        title="Not helpful"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={regenerateLastResponse}
                        disabled={isLoading}
                        title="Regenerate response"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {message.isStreaming && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Generating...</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-primary">Nelson-GPT</span>
              <div className="flex items-center gap-2 text-muted-foreground ml-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching medical literature...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Example Questions (shown when no messages) */}
      {messages.length <= 1 && (
        <div className="p-6 pt-0">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {exampleQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => handleSendMessage(question)}
                  disabled={isLoading}
                >
                  <div className="text-sm">{question}</div>
                </Button>
              ))}
            </div>
            
            {/* New Chat Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleNewChat}
                variant="outline"
                className="gap-2"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Start New Consultation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about pediatric medicine... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[60px] max-h-[200px] pr-12 resize-none"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Evidence-based responses only
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Nelson Textbook citations included
                </span>
                {error && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    Connection issue
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{isLoading ? 'Processing...' : 'Ready'}</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}