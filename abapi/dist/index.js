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
let sessionId = null;
// Setup readline interface for terminal input/output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function handleResponse(response) {
    const resp = response;
    switch (resp.type) {
        case "agent_started":
            // Capture session ID from the first response
            if (!sessionId && resp.session) {
                sessionId = resp.session;
                console.log(`\n🔗 Session: ${sessionId}\n`);
            }
            break;
        case "agent_thinking":
            // Display the agent's thinking message
            console.log(`\n🧠 Thinking: ${resp.content}\n`);
            break;
        case "agent_tool_use":
            // Display the agent's tool use message
            console.log(`\n🔧 Tool Use: ${resp.content}\n`);
            break;
        case "agent_tool_response":
            // Display the agent's tool result message (result emoji)
            console.log(`\n🔧 Tool Result: ${resp.content}\n`);
            break;
        case "agent_response":
            // Display the agent's message
            console.log(`\n🤖 Agent: ${resp.content}\n`);
            break;
        case "agent_cost":
            // Show cost and balance information
            console.log(`💰 Cost: $${resp.cost} | Balance: $${resp.balance?.toFixed(2)}\n`);
            break;
    }
}
/**
 * Send a message to the agent and process the response stream
 */
async function sendMessage(message) {
    try {
        // Prepare parameters - include session ID if we have one
        const params = { message: message };
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
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
}
/**
 * Check if user wants to exit the chat
 */
function shouldExit(input) {
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
//# sourceMappingURL=index.js.map