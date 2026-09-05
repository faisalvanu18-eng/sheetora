import { useEffect } from 'react'
import { SITE } from '../constants'

interface SeoProps {
  title: string
  description: string
  path: string
  /** JSON-LD structured data object(s) */
  jsonLd?: object | object[]
  /** Absolute or root-relative OG/Twitter image. Defaults to the site image. */
  image?: string
  /** og:type — 'website' (default) or 'article'. */
  type?: 'website' | 'article'
  /** Set true to keep a page out of search results. */
  noindex?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

const JSONLD_ID = 'sheetora-jsonld'

/**
 * Lightweight, dependency-free document head manager.
 * Updates title, meta description, canonical, Open Graph and JSON-LD per route.
 */
export default function Seo({ title, description, path, jsonLd, image, type = 'website', noindex }: SeoProps) {
  useEffect(() => {
    const url = `${SITE.url}${path}`
    const imgPath = image || '/og-image.png'
    const imageUrl = imgPath.startsWith('http') ? imgPath : `${SITE.url}${imgPath}`
    document.title = title

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    upsertLink('canonical', url)

    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', SITE.name)
    upsertMeta('property', 'og:locale', 'en_US')
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', imageUrl)

    // Structured data
    const existing = document.getElementById(JSONLD_ID)
    if (existing) existing.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = JSONLD_ID
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
  }, [title, description, path, jsonLd, image, type, noindex])

  return null
}
