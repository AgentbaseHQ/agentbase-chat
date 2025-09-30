/**
 * Agentbase Chat Application - Main Component
 * 
 * This chat interface demonstrates the power of Agentbase AI agents.
 * Template originally created by Agentbase - https://agentbase.sh
 * 
 * Features:
 * - Real-time AI chat with tool usage
 * - Source link integration  
 * - Cost tracking and session management
 * 
 * Powered by Agentbase SDK: https://docs.agentbase.sh
 */

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
import { TypingLoader } from "@/components/prompt-kit/loader";
import { SourceLinks } from "@/components/ui/source-links";
import { ToolUsage } from "@/components/ui/tool-usage";

// Conversation history structure (empty by default)
const conversationHistory: ConversationGroup[] = [
  {
    period: "Today",
    conversations: [],
  },
  {
    period: "Yesterday",
    conversations: [],
  },
  {
    period: "Last 7 days",
    conversations: [],
  },
  {
    period: "Last month",
    conversations: [],
  },
];

// Conversation structure for sidebar
interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: number
}

interface ConversationGroup {
  period: string
  conversations: Conversation[]
}

// Simple types that work with SDK responses
interface ChatMessage {
  id: string
  type: "user" | "agent" | "system"
  content: string
  timestamp: Date
}

// SDK response shape (from Agentbase)
interface SDKResponse {
  type: string
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

// Use SDK response directly - much simpler!
interface AgentResponse {
  id: string
  messages: SDKResponse[] // SDK response objects
  isComplete: boolean
  timestamp: Date
}


// Simplified agent message component using SDK responses directly
const AgentMessageComponent = ({ response }: { response: AgentResponse }) => {
  // Extract different message types from SDK responses
  const sessionInfo = response.messages.find(m => m.type === 'agent_started')?.session
  const thinking = response.messages.filter(m => m.type === 'agent_thinking').map(m => m.content)
  const toolUse = response.messages.filter(m => m.type === 'agent_tool_use')
  const toolResults = response.messages.filter(m => m.type === 'agent_tool_response')
  const content = response.messages.filter(m => m.type === 'agent_response').map(m => m.content).join('\n')
  const costInfo = response.messages.find(m => m.type === 'agent_cost')
  const error = response.messages.find(m => m.type === 'error')?.content

  // Extract source URLs from tool responses
  const extractSourceUrls = (): string[] => {
    const urls: string[] = []
    
    // Look for URLs in tool results  
    toolResults.forEach(result => {
      // The SDK returns tool response content as a JSON string, not an object
      if (result.content) {
        try {
          const parsedContent = JSON.parse(result.content)
          
          // Handle web tool responses
          if (parsedContent.tool === 'web' && parsedContent.response) {
            if (Array.isArray(parsedContent.response)) {
              parsedContent.response.forEach((item: unknown) => {
                const urlItem = item as { url?: string }
                if (urlItem.url && typeof urlItem.url === 'string') {
                  urls.push(urlItem.url)
                }
              })
            }
          }
        } catch {
          // Fallback: extract URLs with regex from the string
          const urlRegex = /https?:\/\/[^\s)]+/g
          const foundUrls = result.content.match(urlRegex) || []
          urls.push(...foundUrls)
        }
      }
    })

    return urls
  }

  const sourceUrls = extractSourceUrls()

  return (
    <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-1 px-6">
      {/* Session info */}
      {sessionInfo && (
        <div className="text-xs text-muted-foreground mb-2">
          🔗 Session: {sessionInfo}
        </div>
      )}
      
      {/* Thinking process */}
      {thinking.length > 0 && (
        <div className="text-sm text-muted-foreground mb-6">
          🧠 {thinking.join(" → ")}
          {!response.isComplete && "..."}
        </div>
      )}
      
      {/* Tool usage */}
      <ToolUsage toolUse={toolUse} />
      
      {/* Main response */}
      {content && (
        <MessageContent markdown className="bg-transparent p-0">
          {content + (!response.isComplete ? "▋" : "")}
        </MessageContent>
      )}
      
      {/* Show loading indicator if streaming and no content yet */}
      {!response.isComplete && !content && (
        <div className="flex items-center gap-2 py-2">
          <TypingLoader size="sm" className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Generating response...</span>
        </div>
      )}
      
      {/* Cost info */}
      {costInfo && (
        <div className="text-xs text-muted-foreground mt-6">
          💰 Cost: ${typeof costInfo.cost === 'number' ? costInfo.cost.toFixed(4) : costInfo.cost} | Balance: ${typeof costInfo.balance === 'number' ? costInfo.balance.toFixed(2) : costInfo.balance}
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 mt-6">
          ⚠️ {error}
        </div>
      )}

      {/* Source Links */}
      <SourceLinks urls={sourceUrls} />
    </Message>
  );
};

// Enhanced loading component with typing animation
const LoadingMessage = () => (
  <Message className="mx-auto flex w-full max-w-3xl flex-col items-start gap-1 px-6">
    <div className="flex flex-col gap-2">
      {/* Typing indicator */}
      <div className="flex items-center gap-2">
        <TypingLoader size="sm" className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">Agent is thinking...</span>
      </div>
      
      {/* Optional: Show what the agent might be doing */}
      <div className="text-xs text-muted-foreground/70">
        Analyzing your question and searching for information
      </div>
    </div>
  </Message>
)

function ChatSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 py-4">
        <a 
          href="https://agentbase.sh" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-row items-center gap-2 px-2 hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://www.agentbase.sh/logos/agentbase.svg" 
            alt="Agentbase" 
            className="size-8" 
          />
          <div className="text-md font-base text-primary tracking-tight">
            Agentbase
          </div>
        </a>
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
              {group.conversations.length === 0 ? (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                group.conversations.map((conversation) => (
                  <SidebarMenuButton key={conversation.id}>
                    <span>{conversation.title}</span>
                  </SidebarMenuButton>
                ))
              )}
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
    setPrompt(value);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [completedResponses, setCompletedResponses] = useState<AgentResponse[]>([]);
  const [currentAgentResponse, setCurrentAgentResponse] = useState<AgentResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    setCurrentAgentResponse(null);

    try {
      // Simple fetch to our API route
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          ...(sessionId && { session: sessionId }),
          mode: 'fast',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get complete response from SDK (no streaming)
      const sdkResponses = await response.json();
      
      // Extract session ID from the first agent_started response
      const sessionResponse = sdkResponses.find((r: SDKResponse) => r.type === 'agent_started');
      if (sessionResponse?.session) {
        setSessionId(sessionResponse.session);
      }

      // Create agent response with all SDK responses
      const completedResponse: AgentResponse = {
        id: `agent-${Date.now()}`,
        messages: Array.isArray(sdkResponses) ? sdkResponses : [sdkResponses],
        isComplete: true,
        timestamp: new Date(),
      };

      // Add to completed responses history
      setCompletedResponses(prev => [...prev, completedResponse]);

      // Auto-scroll
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="bg-background z-10 flex h-16 w-full shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <a 
          href="https://agentbase.sh" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://www.agentbase.sh/logos/agentbase.svg" 
            alt="Agentbase" 
            className="w-6 h-6" 
          />
          <div className="text-foreground font-medium">Agentbase</div>
        </a>
      </header>

      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatContainerRoot className="h-full">
          <ChatContainerContent className="space-y-8 px-5 py-12">
            {/* Show initial prompt if no messages */}
            {chatMessages.length === 0 && completedResponses.length === 0 && !currentAgentResponse && (
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

            {/* Render conversation history (user messages + completed agent responses) */}
            {chatMessages.map((message, index) => (
              <div key={`conversation-${index}`}>
                {/* User message */}
                <Message
                  key={message.id}
                  className="mx-auto flex w-full max-w-3xl flex-col items-end gap-2 px-6"
                >
                  <div className="group flex w-full flex-col items-end gap-2">
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

                {/* Corresponding agent response (if exists) */}
                {completedResponses[index] && (
                  <div className="animate-fade-in">
                    <AgentMessageComponent response={completedResponses[index]} />
                  </div>
                )}
              </div>
            ))}

            {/* Render current streaming agent response */}
            {currentAgentResponse && (
              <div className="animate-fade-in">
                <AgentMessageComponent response={currentAgentResponse} />
              </div>
            )}

            {/* Show loading when waiting for stream */}
            {isLoading && !currentAgentResponse && <LoadingMessage />}
            
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
                  onClick={handleSubmit}
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
