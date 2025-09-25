import { NextRequest, NextResponse } from 'next/server'

// Dynamic import of agentbase-sdk to avoid build issues
async function createAgentbaseClient() {
  try {
    // Import from the abapi directory where the SDK is installed
    const { default: Agentbase } = await import('../../../abapi/node_modules/agentbase-sdk')
    
    const apiKey = process.env.NEXT_PUBLIC_AGENTBASE_API_KEY
    if (!apiKey) {
      throw new Error('AGENTBASE_API_KEY not found')
    }

    return new Agentbase({
      apiKey: apiKey,
    })
  } catch (error) {
    console.error('Failed to create Agentbase client:', error)
    throw error
  }
}

// Mock responses for fallback
const mockResponses = [
  { type: "agent_started", session: `mock_${Date.now()}` },
  { type: "agent_thinking", content: "Analyzing your request..." },
  { type: "agent_response", content: "This is a mock response for development. The real Agentbase SDK integration will work once properly configured." },
  { type: "agent_cost", cost: 0.012, balance: 71.50 }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, session, mode, system, rules, mcpServers } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let agentbase: any
    let useMock = false

    try {
      agentbase = await createAgentbaseClient()
    } catch (error) {
      console.warn('Using mock responses due to SDK error:', error)
      useMock = true
    }

    // Create ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (useMock) {
            // Use mock responses
            for (const response of mockResponses) {
              const chunk = `data: ${JSON.stringify(response)}\n\n`
              controller.enqueue(new TextEncoder().encode(chunk))
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
            }
          } else {
            // Use real Agentbase SDK
            const params = {
              message,
              ...(session && { session }),
              ...(mode && { mode }),
              ...(system && { system }),
              ...(rules && { rules }),
              ...(mcpServers && { mcpServers }),
              streaming: false,
            }

            const agentStream = await agentbase.runAgent(params)
            
            for await (const response of agentStream) {
              const chunk = `data: ${JSON.stringify(response)}\n\n`
              controller.enqueue(new TextEncoder().encode(chunk))
            }
          }
          
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorResponse = {
            type: 'error',
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
          const chunk = `data: ${JSON.stringify(errorResponse)}\n\n`
          controller.enqueue(new TextEncoder().encode(chunk))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}