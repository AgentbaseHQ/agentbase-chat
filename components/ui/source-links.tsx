import { ExternalLink } from "lucide-react"
import { useState } from "react"

interface SourceLinksProps {
  urls: string[]
}

// Extract domain name from URL
function getDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return url
  }
}

// Get favicon URL for a domain
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return '/next.svg' // fallback to existing public asset
  }
}

function SourceLink({ url, index }: { url: string; index: number }) {
  const [faviconFailed, setFaviconFailed] = useState(false)
  
  return (
    <a
      key={index}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs rounded-full transition-colors border border-gray-200"
    >
      {!faviconFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getFaviconUrl(url)}
          alt=""
          className="w-3 h-3"
          onError={() => setFaviconFailed(true)}
        />
      ) : (
        <ExternalLink className="w-3 h-3" />
      )}
      <span className="font-medium">{getDomainName(url)}</span>
    </a>
  )
}

export function SourceLinks({ urls }: SourceLinksProps) {
  // Remove duplicates and filter valid URLs
  const uniqueUrls = Array.from(new Set(urls.filter(url => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })))

  if (uniqueUrls.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {uniqueUrls.map((url, i) => (
        <SourceLink key={i} url={url} index={i} />
      ))}
    </div>
  )
}