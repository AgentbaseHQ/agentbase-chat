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
  const apiKey = process.env.AGENTBASE_API_KEY
  
  if (!apiKey) {
    throw new Error('AGENTBASE_API_KEY not found in environment variables')
  }

  const client = new Agentbase({
    apiKey: apiKey,
  })
  return client
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, session, mode, system, rules, mcpServers } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let agentbase: Agentbase

    try {
      agentbase = createAgentbaseClient()
    } catch {
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

    const agentStream = await agentbase.runAgent(params)
    
    // Collect all responses from the stream (even with streaming: false)
    const responses = []
    for await (const response of agentStream) {
      responses.push(response)
    }
    
    // Return all responses
    return NextResponse.json(responses)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}