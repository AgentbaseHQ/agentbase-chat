import { NextRequest } from "next/server";

// Dynamic import to avoid webpack issues with the SDK
const getAgentbase = async () => {
  const { default: Agentbase } = await import("agentbase-sdk");
  return new Agentbase({
    apiKey: process.env.AGENTBASE_API_KEY,
  });
};

// We'll use dynamic import in the sendMessage function

// Track session ID to maintain conversation continuity (like CLI app)
let sessionId: string | null = null;

/**
 * Handle different types of responses from the agent
 * Exact copy from CLI app agentbase-sdk/index.ts:25-64
 */
function handleResponse(response: any) {
  switch (response.type) {
    case "agent_started":
      // Capture session ID from the first response
      if (!sessionId) {
        sessionId = response.session;
        console.log(`🔗 Session: ${sessionId}`);
      }
      break;

    case "agent_thinking":
      // Display the agent's thinking message
      console.log(`🧠 Thinking: ${response.content}`);
      break;

    case "agent_tool_use":
      // Display the agent's tool use message
      console.log(`🔧 Tool Use: ${response.content}`);
      break;

    case "agent_tool_response":
      // Display the agent's tool result message (result emoji)
      console.log(`🔧 Tool Result: ${response.content}`);
      break;

    case "agent_response":
      // Display the agent's message
      console.log(`🤖 Agent: ${response.content}`);
      break;

    case "agent_cost":
      // Show cost and balance information
      console.log(
        `💰 Cost: $${response.cost} | Balance: $${response.balance.toFixed(
          2
        )}`
      );
      break;
  }
  return response;
}

/**
 * Send a message to the agent and process the response stream
 * Exact copy from CLI app agentbase-sdk/index.ts:69-97
 */
async function sendMessage(message: string, clientSessionId?: string) {
  try {
    // Use client session ID if provided, otherwise use server session ID
    const currentSessionId = clientSessionId || sessionId;
    
    // Prepare parameters - include session ID if we have one
    const params: {
      message: string; // The message to send to the agent
      session?: string; // The session ID to continue the conversation
      mode?: string | "flash" | "fast" | "max"; // The mode for the agent, defaults to fast
      system?: string; // The system prompt for the agent
      rules?: string[]; // The rules for the agent
      mcpServers?: [{ serverName: string; serverUrl: string }]; // The MCP servers for the agent
      streaming?: boolean; // Whether to stream the response token by token, defaults to false
    } = { message: message };

    // Include session ID if we have one to maintain the agent conversation
    if (currentSessionId) {
      params.session = currentSessionId;
    }

    // Send message and get response stream
    const agentbase = await getAgentbase();
    const stream = await agentbase.runAgent(params);

    // Process each response in the stream
    const responses = [];
    for await (const response of stream) {
      const processedResponse = handleResponse(response);
      responses.push(processedResponse);
    }
    
    return responses;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, session } = body;

    console.log("🔄 Received request:", { message, session });

    // Use the exact sendMessage function from CLI app
    const responses = await sendMessage(message, session);

    // Return all responses
    return Response.json({
      responses,
      session: sessionId,
    });
  } catch (error) {
    console.error("❌ API Route Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}