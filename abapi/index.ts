import Agentbase from "agentbase-sdk";
import dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables from .env file
dotenv.config();

// Initialize the Agentbase client with your API key
const agentbase = new Agentbase({
  apiKey: process.env["AGENTBASE_API_KEY"],
});

// Track session ID to maintain conversation continuity
let sessionId: string | null = null;

// Setup readline interface for terminal input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Handle different types of responses from the agent
 */
function handleResponse(response: any) {
  switch (response.type) {
    case "agent_started":
      // Capture session ID from the first response
      if (!sessionId) {
        sessionId = response.session;
        console.log(`\n🔗 Session: ${sessionId}\n`);
      }
      break;

    case "agent_thinking":
      // Display the agent's thinking message
      console.log(`\n🧠 Thinking: ${response.content}\n`);
      break;

    case "agent_tool_use":
      // Display the agent's tool use message
      console.log(`\n🔧 Tool Use: ${response.content}\n`);
      break;

    case "agent_tool_response":
      // Display the agent's tool result message (result emoji)
      console.log(`\n🔧 Tool Result: ${response.content}\n`);
      break;

    case "agent_response":
      // Display the agent's message
      console.log(`\n🤖 Agent: ${response.content}\n`);
      break;

    case "agent_cost":
      // Show cost and balance information
      console.log(
        `💰 Cost: $${response.cost} | Balance: $${response.balance.toFixed(
          2
        )}\n`
      );
      break;
  }
}

/**
 * Send a message to the agent and process the response stream
 */
async function sendMessage(message: string) {
  try {
    // Prepare parameters - include session ID if we have one
    const params: {
      message: string; // The message to send to the agent
      session?: string; // The session ID to continue the conversation
      mode?: "flash" | "fast" | "max"; // The mode for the agent, defaults to fast
      system?: string; // The system prompt for the agent
      rules?: string[]; // The rules for the agent
      mcpServers?: [{ serverName: string; serverUrl: string }]; // The MCP servers for the agent
      streaming?: boolean; // Whether to stream the response token by token, defaults to false
    } = { message: message };

    // Include session ID if we have one to maintain the agent conversation
    if (sessionId) {
      params.session = sessionId;
    }

    // Send message and get response stream
    const stream = await agentbase.runAgent(params);

    // Process each response in the stream
    for await (const response of stream) {
      handleResponse(response);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Check if user wants to exit the chat
 */
function shouldExit(input: string): boolean {
  return ["exit", "quit"].includes(input.toLowerCase());
}

/**
 * Start the interactive chat loop
 */
function startChat() {
  rl.question("💬 You: ", async (input) => {
    // Check for exit commands
    if (shouldExit(input)) {
      console.log("\n👋 Goodbye!");
      rl.close();
      return;
    }

    // Send message if not empty
    if (input.trim()) {
      await sendMessage(input);
    }

    // Continue the chat loop
    startChat();
  });
}

// Welcome message and start the chat
console.log("🚀 Terminal Chat with Agentbase");
console.log('Type "exit" or "quit" to end the conversation\n');
console.log("Try saying: 'Hi, introduce yourself!'");
startChat();
