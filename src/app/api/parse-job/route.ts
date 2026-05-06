import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  let html: string
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch that URL (${pageRes.status}).` },
        { status: 422 }
      )
    }

    html = await pageRes.text()
  } catch {
    return NextResponse.json(
      { error: 'Could not reach that URL. Check the link and try again.' },
      { status: 422 }
    )
  }

  // Try schema.org JobPosting JSON-LD first (works on LinkedIn, Indeed, Greenhouse, Lever, etc.)
  const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1])
      const posting = findJobPosting(data)
      if (posting) {
        return NextResponse.json(extractFromJsonLd(posting))
      }
    } catch {
      // malformed JSON-LD, skip
    }
  }

  // Fallback: meta tags and og tags
  const result = extractFromMeta(html)
  if (result.company || result.role) {
    return NextResponse.json(result)
  }

  return NextResponse.json(
    { error: 'Could not automatically detect job details from this page. Fill in the form manually.' },
    { status: 422 }
  )
}

// schema.org data can be a single object or an array, and may be nested in @graph
function findJobPosting(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  if (obj['@type'] === 'JobPosting') return obj

  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph'] as unknown[]) {
      const found = findJobPosting(item)
      if (found) return found
    }
  }

  if (Array.isArray(data)) {
    for (const item of data as unknown[]) {
      const found = findJobPosting(item)
      if (found) return found
    }
  }

  return null
}

function extractFromJsonLd(posting: Record<string, unknown>) {
  const company =
    typeof posting.hiringOrganization === 'object' && posting.hiringOrganization !== null
      ? ((posting.hiringOrganization as Record<string, unknown>).name as string | undefined)
      : typeof posting.hiringOrganization === 'string'
      ? posting.hiringOrganization
      : undefined

  const role = posting.title as string | undefined

  let salary_min: number | null = null
  let salary_max: number | null = null

  const baseSalary = posting.baseSalary as Record<string, unknown> | undefined
  if (baseSalary) {
    const value = baseSalary.value as Record<string, unknown> | undefined
    if (value) {
      salary_min = typeof value.minValue === 'number' ? Math.round(value.minValue) : null
      salary_max = typeof value.maxValue === 'number' ? Math.round(value.maxValue) : null
      if (!salary_min && typeof value.value === 'number') {
        salary_min = Math.round(value.value)
      }
    }
  }

  // Location: jobLocation is a Place or array of Places
  let location: string | null = null
  const jobLocation = posting.jobLocation
  if (jobLocation) {
    const place = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation
    if (place && typeof place === 'object') {
      const addr = (place as Record<string, unknown>).address
      if (addr && typeof addr === 'object') {
        const a = addr as Record<string, unknown>
        const parts = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean)
        if (parts.length) location = parts.join(', ')
      } else if (typeof addr === 'string') {
        location = addr
      }
    }
  }
  // jobLocationType: "TELECOMMUTE" means remote
  if (posting.jobLocationType === 'TELECOMMUTE') {
    location = location ? `Remote · ${location}` : 'Remote'
  }

  return { company: company ?? null, role: role ?? null, location, salary_min, salary_max }
}

function extractFromMeta(html: string) {
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const ogSiteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()

  // Many job boards put "Role at Company" or "Role - Company" in the title
  let role: string | null = null
  let company: string | null = null

  const candidate = ogTitle ?? titleTag ?? ''
  const atMatch = candidate.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|\-–]|$)/i)
  const dashMatch = candidate.match(/^(.+?)\s*[|\-–]\s*(.+?)(?:\s*[|\-–]|$)/)

  if (atMatch) {
    role = atMatch[1].trim()
    company = atMatch[2].trim()
  } else if (dashMatch) {
    role = dashMatch[1].trim()
    company = ogSiteName ?? dashMatch[2].trim()
  } else if (ogSiteName) {
    role = candidate.replace(ogSiteName, '').replace(/[|\-–]/g, '').trim() || null
    company = ogSiteName
  }

  return { company, role, location: null, salary_min: null, salary_max: null }
}
