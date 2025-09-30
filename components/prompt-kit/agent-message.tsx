"use client";

import { MessageContent } from "@/components/prompt-kit/message";
import { DotsLoader } from "@/components/prompt-kit/loader";
import { Tool } from "@/components/prompt-kit/tool";
import type { ToolPart } from "@/components/prompt-kit/tool";
import { SimpleMessage } from "@/lib/agentbase-client";

interface AgentMessageProps {
  message: SimpleMessage;
  isLastMessage?: boolean;
  className?: string;
  allMessages?: SimpleMessage[];
  currentIndex?: number;
}

export function AgentMessage({ message, allMessages = [], currentIndex = 0 }: AgentMessageProps) {
  const { type, content } = message;

  // Helper to find latest web tool response for sources
  const findLatestWebToolResponse = () => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allMessages[i]?.type === "agent_tool_response") {
        try {
          const toolResult = JSON.parse(allMessages[i].content);
          if (toolResult.tool === "web" && toolResult.response) {
            return toolResult.response;
          }
        } catch {}
      }
    }
    return null;
  };

  // Mirror CLI's handleResponse exactly
  switch (type) {
    case "agent_started":
      // Don't display session start
      return null;

    case "agent_thinking":
      return (
        <div className="flex items-center gap-2">
          <DotsLoader size="sm" />
          <MessageContent markdown>{`🧠 Thinking: ${content}`}</MessageContent>
        </div>
      );

    case "agent_tool_use":
      // Parse for Tool component
      let toolInfo;
      try {
        toolInfo = JSON.parse(content);
      } catch {
        toolInfo = { content };
      }
      
      const toolUsePart: ToolPart = {
        type: toolInfo.tool || "tool-call",
        state: "input-available",
        input: toolInfo,
        toolCallId: `${Date.now()}`
      };

      return (
        <div className="flex flex-col gap-2">
          <MessageContent markdown>{`🔧 Tool Use: ${toolInfo.tool || 'Unknown'}`}</MessageContent>
          <Tool toolPart={toolUsePart} defaultOpen={false} />
        </div>
      );

    case "agent_tool_response":
      // Parse for Tool component  
      let toolResult;
      try {
        toolResult = JSON.parse(content);
      } catch {
        toolResult = { content };
      }

      const toolResultPart: ToolPart = {
        type: toolResult.tool || "tool-result", 
        state: "output-available",
        output: toolResult,
        toolCallId: `${Date.now()}`
      };

      return (
        <div className="flex flex-col gap-2">
          <MessageContent markdown>{`🔧 Tool Result`}</MessageContent>
          <Tool toolPart={toolResultPart} defaultOpen={false} />
        </div>
      );

    case "agent_response":
      const webSources = findLatestWebToolResponse();
      
      return (
        <div className="flex flex-col gap-2">
          <MessageContent markdown>{`🤖 Agent: ${content}`}</MessageContent>
          
          {/* Show sources under the response */}
          {webSources && (
            <div className="flex flex-wrap gap-2">
              {webSources.slice(0, 5).map((source: any, i: number) => {
                const domain = new URL(source.url).hostname.replace('www.', '');
                return (
                  <a 
                    key={i}
                    href={source.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium"
                  >
                    <div className="size-3 rounded-sm bg-gray-400" />
                    <span>{domain}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      );

    case "agent_cost":
      // Hide costs
      return null;

    default:
      return (
        <MessageContent markdown>{content}</MessageContent>
      );
  }
}