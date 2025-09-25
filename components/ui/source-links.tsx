import { ExternalLink } from "lucide-react"

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
    return '/favicon.ico' // fallback
  }
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
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full transition-colors border border-slate-200"
        >
          <img
            src={getFaviconUrl(url)}
            alt=""
            className="w-3 h-3"
            onError={(e) => {
              // Fallback to external link icon if favicon fails
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const icon = target.nextElementSibling as HTMLElement
              if (icon) icon.style.display = 'inline'
            }}
          />
          <ExternalLink className="w-3 h-3 hidden" />
          <span className="font-medium">{getDomainName(url)}</span>
        </a>
      ))}
    </div>
  )
}