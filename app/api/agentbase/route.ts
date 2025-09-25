/**
 * Agentbase API Route
 * 
 * This API endpoint integrates with the Agentbase SDK to power AI chat functionality.
 * Template originally created by Agentbase - https://agentbase.sh
 * 
 * Learn more: https://docs.agentbase.sh
 */

import { NextRequest, NextResponse } from 'next/server'
import Agentbase from 'agentbase-sdk'

// Create agentbase client
function createAgentbaseClient() {
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

    let agentbase: Agentbase

    try {
      agentbase = createAgentbaseClient()
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