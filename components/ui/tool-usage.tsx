import { Search, Globe, Code, FileText, Database, Wrench } from "lucide-react"

interface ToolUsageProps {
  toolUse: Array<{
    tool_name?: string
    content?: string
    type: string
  }>
}

// Get appropriate icon for each tool
function getToolIcon(toolName: string) {
  switch (toolName.toLowerCase()) {
    case 'web':
    case 'websearch':
      return <Search className="w-3 h-3" />
    case 'browse':
    case 'crawler':
      return <Globe className="w-3 h-3" />
    case 'code':
    case 'python':
      return <Code className="w-3 h-3" />
    case 'file':
    case 'read':
      return <FileText className="w-3 h-3" />
    case 'database':
    case 'sql':
      return <Database className="w-3 h-3" />
    default:
      return <Wrench className="w-3 h-3" />
  }
}

// Get display name for tool
function getToolDisplayName(toolName: string) {
  switch (toolName.toLowerCase()) {
    case 'web':
      return 'Web Search'
    case 'websearch':
      return 'Web Search'
    case 'browse':
      return 'Web Browse'
    case 'crawler':
      return 'Web Crawler'
    case 'code':
      return 'Code Execution'
    case 'python':
      return 'Python'
    case 'file':
      return 'File Access'
    case 'read':
      return 'File Read'
    case 'database':
      return 'Database Query'
    case 'sql':
      return 'SQL Query'
    default:
      return toolName.charAt(0).toUpperCase() + toolName.slice(1)
  }
}

// Extract tool info from agent_tool_use content
function extractToolInfo(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      tool: parsed.tool || 'unknown',
      input: parsed.input ? JSON.parse(parsed.input) : null
    }
  } catch {
    return { tool: 'unknown', input: null }
  }
}

export function ToolUsage({ toolUse }: ToolUsageProps) {
  if (toolUse.length === 0) {
    return null
  }

  // Extract unique tools used
  const toolsUsed = toolUse.map(use => {
    if (use.content) {
      const toolInfo = extractToolInfo(use.content)
      return {
        name: toolInfo.tool,
        input: toolInfo.input,
        displayName: getToolDisplayName(toolInfo.tool),
        icon: getToolIcon(toolInfo.tool)
      }
    }
    return {
      name: use.tool_name || 'unknown',
      input: null,
      displayName: getToolDisplayName(use.tool_name || 'unknown'),
      icon: getToolIcon(use.tool_name || 'unknown')
    }
  })

  // Remove duplicates based on tool name
  const uniqueTools = toolsUsed.filter((tool, index, self) => 
    index === self.findIndex(t => t.name === tool.name)
  )

  return (
    <div className="flex flex-wrap gap-2 mb-8 mt-6">
      {uniqueTools.map((tool, i) => {
        const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border border-foreground/20 bg-transparent"
        const colorClasses = "text-foreground"
        
        return (
          <div
            key={i}
            className={`${baseClasses} ${colorClasses}`}
          >
            {tool.icon}
            <span className="font-medium">{tool.displayName}</span>
            {tool.input?.query && (
              <span className="text-foreground/60">
                • &quot;{tool.input.query.length > 30 ? tool.input.query.substring(0, 30) + '...' : tool.input.query}&quot;
              </span>
            )}
            {tool.input?.command && (
              <span className="text-foreground/60">
                • {tool.input.command}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}