import { NextRequest, NextResponse } from 'next/server'

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url: string }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No GEMINI_API_KEY set in .env.local' })
  if (!url) return NextResponse.json({ error: 'No URL provided' })

  // Fetch the job page server-side (avoids CORS, many job boards serve plain HTML)
  let pageText: string
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!pageRes.ok) {
      return NextResponse.json({
        error: `Could not fetch job page (${pageRes.status}) — the URL may require login`,
      })
    }

    const html = await pageRes.text()
    pageText = stripHtml(html).slice(0, 10_000) // cap to keep prompt reasonable
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isTimeout = message.includes('aborted') || message.includes('timeout')
    console.error('[job-analysis] fetch error:', err)
    return NextResponse.json({
      error: isTimeout
        ? 'Job page took too long to respond — try again, or check if the URL requires login'
        : `Could not fetch job page: ${message}`,
    })
  }

  if (!pageText.trim()) {
    return NextResponse.json({ error: 'Job page returned no readable text — it may require login or JavaScript' })
  }

  const prompt = `You are helping a designer prepare for a job interview. Below is text extracted from a job posting. Extract the most useful information to help them tailor their application and prep.

Job posting text:
${pageText}

Return a JSON object with exactly three fields:
- "lookingFor": array of 3–5 short strings — what this role/company is specifically looking for (responsibilities, type of person, key outcomes)
- "skills": array of 3–7 short strings — specific skills, tools, or experience explicitly mentioned
- "prepTips": array of 2–4 short strings — concrete, actionable things the candidate should prepare or emphasize for this specific role

Rules:
- Each string should be a short phrase or sentence, max ~12 words
- Only include things actually present in the posting, do not invent
- Skills should be specific (e.g. "Figma", "cross-functional collaboration") not generic
- Prep tips should be actionable (e.g. "Prepare portfolio case showing 0→1 product work")
- Return only valid JSON, no markdown, no explanation`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[job-analysis] Gemini error', res.status, errText)
      return NextResponse.json({ error: `Gemini ${res.status}: ${errText}` })
    }

    const data = await res.json()
    console.log('[job-analysis] raw Gemini response:', JSON.stringify(data))
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text) {
      return NextResponse.json({ error: `No text in Gemini response. Full: ${JSON.stringify(data)}` })
    }

    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) {
      return NextResponse.json({ error: `Could not find JSON in response: ${text}` })
    }

    const parsed = JSON.parse(text.slice(start, end + 1))
    return NextResponse.json({
      lookingFor: (parsed.lookingFor ?? []).slice(0, 5),
      skills:     (parsed.skills     ?? []).slice(0, 7),
      prepTips:   (parsed.prepTips   ?? []).slice(0, 4),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isTimeout = message.includes('aborted') || message.includes('timeout')
    console.error('[job-analysis] unexpected error', err)
    return NextResponse.json({
      error: isTimeout ? 'Analysis timed out — try regenerating' : message,
    })
  }
}
