// Simple client that mirrors the CLI exactly

export interface SimpleMessage {
  id: string;
  type: string; // matches SDK response.type exactly
  content: string;
  cost?: number;
  balance?: number;
  session?: string;
}

export class SimpleAgentbaseClient {
  private sessionId: string | null = null;

  async *sendMessage(message: string) {
    try {
      // Call API route (same as current implementation)
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          session: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Update session ID
      if (data.session) {
        this.sessionId = data.session;
      }

      // Yield each response exactly as SDK provides it
      for (const agentResponse of data.responses) {
        yield {
          id: `${Date.now()}-${Math.random()}`,
          type: agentResponse.type,
          content: agentResponse.content,
          cost: agentResponse.cost,
          balance: agentResponse.balance,
          session: agentResponse.session,
        } as SimpleMessage;
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  getSessionId() {
    return this.sessionId;
  }

  resetSession() {
    this.sessionId = null;
  }

  async getMessageHistory(): Promise<SimpleMessage[]> {
    if (!this.sessionId) return [];
    
    try {
      const response = await fetch(`/api/agent/history?session=${this.sessionId}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error("Error loading history:", error);
      return [];
    }
  }

  async clearMessages(): Promise<boolean> {
    if (!this.sessionId) return true;
    
    try {
      const response = await fetch('/api/agent/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: this.sessionId }),
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error clearing messages:", error);
      return false;
    }
  }
}

export const agentbaseClient = new SimpleAgentbaseClient();