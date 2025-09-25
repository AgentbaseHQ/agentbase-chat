import { NextRequest, NextResponse } from 'next/server'

// Dynamic import of agentbase-sdk to avoid build issues
async function createAgentbaseClient() {
  try {
    console.log('Attempting to import Agentbase SDK...')
    // Import from the abapi directory where the SDK is installed
    const { default: Agentbase } = await import('../../../abapi/node_modules/agentbase-sdk')
    console.log('SDK imported successfully')
    
    const apiKey = process.env.NEXT_PUBLIC_AGENTBASE_API_KEY || process.env.AGENTBASE_API_KEY
    console.log('API key found:', !!apiKey)
    if (!apiKey) {
      throw new Error('AGENTBASE_API_KEY not found in environment variables')
    }

    console.log('Creating Agentbase client...')
    const client = new Agentbase({
      apiKey: apiKey,
    })
    console.log('Agentbase client created successfully')
    return client
  } catch (error) {
    console.error('Failed to create Agentbase client:', error)
    throw error
  }
}


export async function POST(request: NextRequest) {
  console.log('API route hit!')
  try {
    console.log('Parsing request body...')
    const body = await request.json()
    console.log('Request body:', body)
    const { message, session, mode, system, rules, mcpServers } = body

    // Validate required fields
    if (!message) {
      console.log('No message provided')
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let agentbase: any

    try {
      agentbase = await createAgentbaseClient()
    } catch (error) {
      console.error('Failed to create Agentbase client:', error)
      return NextResponse.json({ error: 'Agentbase SDK not available' }, { status: 500 })
    }

    // Use real Agentbase SDK with streaming disabled
    const params = {
      message,
      ...(session && { session }),
      ...(mode && { mode }),
      ...(system && { system }),
      ...(rules && { rules }),
      ...(mcpServers && { mcpServers }),
      streaming: false, // Disable streaming for complete responses
    }

    console.log('Calling runAgent with params:', params)
    const agentStream = await agentbase.runAgent(params)
    console.log('SDK response type:', typeof agentStream)
    
    // Collect all responses from the stream (even with streaming: false)
    const responses = []
    for await (const response of agentStream) {
      responses.push(response)
    }
    
    console.log('Collected responses:', responses)
    
    // Return all responses
    return NextResponse.json(responses)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}