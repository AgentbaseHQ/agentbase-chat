"use client";

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// import { cn } from "@/lib/utils";
import {
  ArrowUp,
  Copy,
  PlusIcon,
  Search,
  Square,
  AlertTriangle,
} from "lucide-react";
import { useRef, useState } from "react";
import { TextDotsLoader } from "@/components/prompt-kit/loader";
// import { CodeBlock, CodeBlockCode } from "@/components/prompt-kit/code-block";

// Initial conversation history
const conversationHistory = [
  {
    period: "Today",
    conversations: [
      {
        id: "t1",
        title: "Project roadmap discussion",
        lastMessage:
          "Let's prioritize the authentication features for the next sprint.",
        timestamp: new Date().setHours(new Date().getHours() - 2),
      },
      {
        id: "t2",
        title: "API Documentation Review",
        lastMessage:
          "The endpoint descriptions need more detail about rate limiting.",
        timestamp: new Date().setHours(new Date().getHours() - 5),
      },
      {
        id: "t3",
        title: "Frontend Bug Analysis",
        lastMessage:
          "I found the issue - we need to handle the null state in the user profile component.",
        timestamp: new Date().setHours(new Date().getHours() - 8),
      },
    ],
  },
  {
    period: "Yesterday",
    conversations: [
      {
        id: "y1",
        title: "Database Schema Design",
        lastMessage:
          "Let's add indexes to improve query performance on these tables.",
        timestamp: new Date().setDate(new Date().getDate() - 1),
      },
      {
        id: "y2",
        title: "Performance Optimization",
        lastMessage:
          "The lazy loading implementation reduced initial load time by 40%.",
        timestamp: new Date().setDate(new Date().getDate() - 1),
      },
    ],
  },
  {
    period: "Last 7 days",
    conversations: [
      {
        id: "w1",
        title: "Authentication Flow",
        lastMessage: "We should implement the OAuth2 flow with refresh tokens.",
        timestamp: new Date().setDate(new Date().getDate() - 3),
      },
      {
        id: "w2",
        title: "Component Library",
        lastMessage:
          "These new UI components follow the design system guidelines perfectly.",
        timestamp: new Date().setDate(new Date().getDate() - 5),
      },
      {
        id: "w3",
        title: "UI/UX Feedback",
        lastMessage:
          "The navigation redesign received positive feedback from the test group.",
        timestamp: new Date().setDate(new Date().getDate() - 6),
      },
    ],
  },
  {
    period: "Last month",
    conversations: [
      {
        id: "m1",
        title: "Initial Project Setup",
        lastMessage:
          "All the development environments are now configured consistently.",
        timestamp: new Date().setDate(new Date().getDate() - 15),
      },
    ],
  },
];

// Types for Agentbase API responses
type AgentbaseResponseType = 
  | "agent_started"
  | "agent_thinking" 
  | "agent_tool_use"
  | "agent_tool_response"
  | "agent_response"
  | "agent_cost"
  | "error"

interface AgentbaseResponse {
  type: AgentbaseResponseType
  content?: string
  session?: string
  cost?: number
  balance?: number
  tool_name?: string
  tool_input?: Record<string, unknown>
  tool_output?: Record<string, unknown>
  tool_call_id?: string
  error?: string
}

interface ChatMessage {
  id: string
  type: "user" | "agent" | "system"
  content: string
  timestamp: Date
}

interface AgentResponse {
  id: string
  type: "agent"
  sessionInfo: string
  thinking: string[]
  toolUse: string[]
  toolResults: string[]
  response: string[]
  cost?: { cost: number | string; balance: number | string }
  error?: string
  timestamp: Date
  isStreaming: boolean
}


// Single agent message component that shows accumulated response
const AgentMessageComponent = ({ response }: { response: AgentResponse }) => {
  return (
    <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-1 px-6">
      {/* Session info */}
      {response.sessionInfo && (
        <div className="text-xs text-muted-foreground mb-1">
          🔗 {response.sessionInfo}
        </div>
      )}
      
      {/* Thinking process */}
      {response.thinking.length > 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          🧠 {response.thinking.join(" → ")}
          {response.isStreaming && response.thinking.length > 0 && "..."}
        </div>
      )}
      
      {/* Tool usage */}
      {response.toolUse.length > 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          {response.toolUse.map((tool, i) => (
            <div key={i}>🔧 Tool: {tool}</div>
          ))}
        </div>
      )}
      
      {/* Tool results */}
      {response.toolResults.length > 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          {response.toolResults.map((result, i) => (
            <div key={i}>📋 Result: {result}</div>
          ))}
        </div>
      )}
      
      {/* Main response */}
      {response.response.length > 0 && (
        <MessageContent className="whitespace-pre-wrap">
          {response.response.join("\n")}
          {response.isStreaming && "▋"}
        </MessageContent>
      )}
      
      {/* Show loading indicator if streaming and no response yet */}
      {response.isStreaming && response.response.length === 0 && (
        <MessageContent className="text-muted-foreground">
          <TextDotsLoader text="Agent is responding" />
        </MessageContent>
      )}
      
      {/* Cost info */}
      {response.cost && (
        <div className="text-xs text-muted-foreground mt-2">
          💰 Cost: ${typeof response.cost.cost === "string" ? response.cost.cost : response.cost.cost.toFixed(4)} | 
          Balance: ${typeof response.cost.balance === "string" ? response.cost.balance : response.cost.balance.toFixed(2)}
        </div>
      )}
      
      {/* Error */}
      {response.error && (
        <div className="text-sm text-red-600 mt-1">
          ⚠️ {response.error}
        </div>
      )}
    </Message>
  );
};

// Loading component
const LoadingMessage = () => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-6">
    <div className="group flex w-full flex-col gap-0">
      <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
        <TextDotsLoader text="Agent is responding" />
      </div>
    </div>
  </Message>
)

// Initial chat messages - keeping original for backward compatibility
// const initialMessages = [];

function ChatSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 py-4">
        <div className="flex flex-row items-center gap-2 px-2">
          <div className="bg-primary/10 size-8 rounded-md"></div>
          <div className="text-md font-base text-primary tracking-tight">
            zola.chat
          </div>
        </div>
        <Button variant="ghost" className="size-8">
          <Search className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <div className="px-4">
          <Button
            variant="outline"
            className="mb-4 flex w-full items-center gap-2"
          >
            <PlusIcon className="size-4" />
            <span>New Chat</span>
          </Button>
        </div>
        {conversationHistory.map((group) => (
          <SidebarGroup key={group.period}>
            <SidebarGroupLabel>{group.period}</SidebarGroupLabel>
            <SidebarMenu>
              {group.conversations.map((conversation) => (
                <SidebarMenuButton key={conversation.id}>
                  <span>{conversation.title}</span>
                </SidebarMenuButton>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function ChatContent() {
  const [prompt, setPrompt] = useState("");
  
  const handlePromptChange = (value: string) => {
    console.log('Parent setPrompt called with:', value);
    setPrompt(value);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Buffer for handling incomplete SSE chunks
  const sseBufferRef = useRef<string>("");

  // Agentbase API client function
  const callAgentbaseAPI = async (message: string, session?: string) => {
    const response = await fetch('/api/agentbase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        ...(session && { session }),
        mode: 'fast',
        streaming: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body;
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: prompt.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setError(null);
    setAgentResponse(null);

    try {
      const stream = await callAgentbaseAPI(userMessage.content, sessionId || undefined);
      
      if (!stream) {
        throw new Error('No response stream received');
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Append new chunk to buffer
        const chunk = decoder.decode(value, { stream: true });
        sseBufferRef.current += chunk;
        
        // Process complete lines from buffer
        const lines = sseBufferRef.current.split('\n');
        
        // Keep the last incomplete line in buffer
        sseBufferRef.current = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: AgentbaseResponse = JSON.parse(line.slice(6));
              
              // Handle session ID from agent_started
              if (data.type === 'agent_started' && data.session) {
                setSessionId(data.session);
              }
              
              // Update agent response with new stream data
              setAgentResponse(prev => {
                if (!prev) {
                  // Create new agent response
                  const newResponse: AgentResponse = {
                    id: `agent-${Date.now()}`,
                    type: "agent",
                    sessionInfo: "",
                    thinking: [],
                    toolUse: [],
                    toolResults: [],
                    response: [],
                    timestamp: new Date(),
                    isStreaming: true
                  };
                  
                  // Add first event
                  switch (data.type) {
                    case 'agent_started':
                      newResponse.sessionInfo = data.session ? `Session: ${data.session}` : "Session started";
                      break;
                    case 'agent_thinking':
                      newResponse.thinking.push(data.content || "");
                      break;
                    case 'agent_tool_use':
                      newResponse.toolUse.push(data.content || "");
                      break;
                    case 'agent_tool_response':
                      newResponse.toolResults.push(data.content || "");
                      break;
                    case 'agent_response':
                      newResponse.response.push(data.content || "");
                      break;
                    case 'agent_cost':
                      if (typeof data.cost !== "undefined" && typeof data.balance !== "undefined") {
                        newResponse.cost = { cost: data.cost, balance: data.balance };
                      }
                      break;
                    case 'error':
                      newResponse.error = data.content || "An error occurred";
                      break;
                  }
                  
                  return newResponse;
                } else {
                  // Update existing response
                  const updated = { ...prev };
                  
                  switch (data.type) {
                    case 'agent_started':
                      updated.sessionInfo = data.session ? `Session: ${data.session}` : "Session started";
                      break;
                    case 'agent_thinking':
                      updated.thinking.push(data.content || "");
                      break;
                    case 'agent_tool_use':
                      updated.toolUse.push(data.content || "");
                      break;
                    case 'agent_tool_response':
                      updated.toolResults.push(data.content || "");
                      break;
                    case 'agent_response':
                      updated.response.push(data.content || "");
                      break;
                    case 'agent_cost':
                      if (typeof data.cost !== "undefined" && typeof data.balance !== "undefined") {
                        updated.cost = { cost: data.cost, balance: data.balance };
                      }
                      break;
                    case 'error':
                      updated.error = data.content || "An error occurred";
                      break;
                  }
                  
                  return updated;
                }
              });
              
              // Auto-scroll to bottom
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            } catch (parseError) {
              console.error('Failed to parse stream data:', parseError, 'Line:', line);
            }
          }
        }
      }
      
      // Process any remaining data in buffer
      if (sseBufferRef.current.trim() && sseBufferRef.current.startsWith('data: ')) {
        try {
          const data: AgentbaseResponse = JSON.parse(sseBufferRef.current.slice(6));
          
          setAgentResponse(prev => {
            if (!prev) return null;
            
            const updated = { ...prev };
            switch (data.type) {
              case 'agent_started':
                updated.sessionInfo = data.session ? `Session: ${data.session}` : "Session started";
                break;
              case 'agent_thinking':
                updated.thinking.push(data.content || "");
                break;
              case 'agent_tool_use':
                updated.toolUse.push(data.content || "");
                break;
              case 'agent_tool_response':
                updated.toolResults.push(data.content || "");
                break;
              case 'agent_response':
                updated.response.push(data.content || "");
                break;
              case 'agent_cost':
                if (typeof data.cost !== "undefined" && typeof data.balance !== "undefined") {
                  updated.cost = { cost: data.cost, balance: data.balance };
                }
                break;
              case 'error':
                updated.error = data.content || "An error occurred";
                break;
            }
            return updated;
          });
        } catch (parseError) {
          console.error('Failed to parse final stream data:', parseError);
        }
      }
      
      // Clear buffer
      sseBufferRef.current = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      
      // Mark agent response as complete
      setAgentResponse(prev => prev ? { ...prev, isStreaming: false } : null);
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="bg-background z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="text-foreground">Agentbase Chat</div>
      </header>

      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-4 px-5 py-12">
            {/* Show initial prompt if no messages */}
            {chatMessages.length === 0 && !agentResponse && (
              <div className="mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
                <div className="text-foreground mb-2 font-medium">
                  Try asking:
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>What can you help me with?</li>
                  <li>Explain React components</li>
                  <li>Help me debug this code</li>
                </ul>
              </div>
            )}

            {/* Render user messages */}
            {chatMessages.map((message) => (
              <Message
                key={message.id}
                className="mx-auto flex w-full max-w-3xl flex-col items-end gap-2 px-6"
              >
                <div className="group flex w-full flex-col items-end gap-1">
                  <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 whitespace-pre-wrap sm:max-w-[75%]">
                    {message.content}
                  </MessageContent>
                  <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <MessageAction tooltip="Copy" delayDuration={100}>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Copy />
                      </Button>
                    </MessageAction>
                  </MessageActions>
                </div>
              </Message>
            ))}

            {/* Render agent response */}
            {agentResponse && (
              <div className="animate-fade-in">
                <AgentMessageComponent response={agentResponse} />
              </div>
            )}

            {/* Show loading when waiting for stream */}
            {isLoading && !agentResponse && <LoadingMessage />}
            
            {/* Show error message */}
            {error && (
              <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-2 px-6">
                <div className="group flex w-full flex-col items-start gap-0">
                  <div className="text-primary flex min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 border-red-300 bg-red-300/20 px-2 py-1">
                    <AlertTriangle size={16} className="text-red-500" />
                    <p className="text-red-500">{error}</p>
                  </div>
                </div>
              </Message>
            )}
          </ChatContainerContent>
          <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
            <ScrollButton className="shadow-sm" />
          </div>
        </ChatContainerRoot>
      </div>

      <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            value={prompt}
            onValueChange={handlePromptChange}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            className="w-full border-input bg-popover border rounded-3xl shadow-xs"
          >
            <PromptInputTextarea 
              placeholder="Ask me anything..." 
              className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3]"
            />
            <PromptInputActions className="justify-end pt-2 pr-2 pb-2">
              <PromptInputAction
                tooltip={isLoading ? "Stop generation" : "Send message"}
              >
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  disabled={!prompt.trim() || isLoading}
                  onClick={() => {
                    console.log('Button clicked! Prompt:', prompt);
                    handleSubmit();
                  }}
                >
                  {isLoading ? (
                    <Square className="size-5 fill-current" />
                  ) : (
                    <ArrowUp className="size-5" />
                  )}
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </main>
  );
}

function FullChatApp() {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset>
        <ChatContent />
      </SidebarInset>
    </SidebarProvider>
  );
}

export { FullChatApp };
