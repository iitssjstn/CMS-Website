import { Router, Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { asyncHandler } from '@/utils/errors';
import { optionalAuth } from '@/middleware/auth';
import { getSiteSettings } from '@/utils/siteSettings';

const router = Router();

router.use(optionalAuth);

// Health checks
router.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/readyz', asyncHandler(async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
}));

// Homepage
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = await prisma.page.findFirst({
    where: { slug: '/', status: 'PUBLISHED' },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });

  const navPages = await prisma.page.findMany({
    where: { status: 'PUBLISHED', slug: { not: '/' } },
    select: { title: true, slug: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  });

  const settings = await getSiteSettings();

  if (!page) {
    return res.send(renderPage({ page: null, navPages, settings, user: req.user }));
  }

  res.send(renderPage({ page, navPages, settings, user: req.user }));
}));

// Dynamic page routes
router.get('/:slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  // Skip API and admin routes
  if (slug.startsWith('api') || slug.startsWith('admin') || slug === 'setup' || slug === 'uploads') {
    return res.status(404).send(render404(req.user));
  }

  const page = await prisma.page.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!page) {
    return res.status(404).send(render404(req.user));
  }

  const navPages = await prisma.page.findMany({
    where: { status: 'PUBLISHED', slug: { not: '/' } },
    select: { title: true, slug: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  });

  const settings = await getSiteSettings();

  res.send(renderPage({ page, navPages, settings, user: req.user }));
}));

// Contact form submission (public)
router.post('/contact', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, subject, message, honeypot } = req.body;

  if (honeypot) {
    return res.json({ success: true });
  }

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }

  await prisma.contactMessage.create({
    data: { name, email: email.toLowerCase(), subject, message, ipAddress: req.ip, userAgent: req.get('user-agent') },
  });

  res.json({ success: true });
}));

// Sitemap.xml
router.get('/sitemap.xml', asyncHandler(async (_req: Request, res: Response) => {
  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const urls = pages.map(page => {
    const url = page.slug === '/' ? baseUrl : `${baseUrl}/${page.slug}`;
    return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${page.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${page.slug === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
}));

// Robots.txt
router.get('/robots.txt', asyncHandler(async (_req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`;
  res.set('Content-Type', 'text/plain');
  res.send(txt);
}));

function renderPage({ page, navPages, settings, user }: any): string {
  const siteName = settings.site_name as string || 'Mijn Website';
  const siteDescription = settings.site_description as string || '';
  const logo = settings.site_logo as string || null;
  const favicon = settings.favicon as string || null;
  const footerText = settings.footer_text as string || `© ${new Date().getFullYear()} ${siteName}`;
  const contactEmail = settings.contact_email as string || '';
  const contactPhone = settings.contact_phone as string || '';
  const contactAddress = settings.contact_address as string || '';
  const socialLinks = [
    { key: 'social_facebook', label: 'Facebook', icon: 'facebook' },
    { key: 'social_twitter', label: 'Twitter', icon: 'twitter' },
    { key: 'social_instagram', label: 'Instagram', icon: 'instagram' },
    { key: 'social_linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { key: 'social_youtube', label: 'YouTube', icon: 'youtube' },
  ].map(s => ({ ...s, url: settings[s.key] as string })).filter(s => s.url);

  const navHtml = navPages.map((p: any) => 
    `<li><a href="/${p.slug}" class="px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg">${p.title}</a></li>`
  ).join('');

  const socialHtml = socialLinks.map(s => 
    `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-blue-600 transition-colors" aria-label="${s.label}">${getSocialIcon(s.icon)}</a>`
  ).join('');

  let contentHtml = '';
  if (page) {
    contentHtml = page.blocks.map((block: any) => renderBlock(block, settings)).join('');
  } else {
    contentHtml = `
      <section class="py-20 text-center">
        <div class="max-w-3xl mx-auto px-4">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Welkom bij ${siteName}</h1>
          <p class="text-xl text-gray-600 mb-8">${siteDescription || 'Deze website is nog in aanbouw. Voeg pagina\'s toe via het admin paneel.'}</p>
          <a href="/admin" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">Naar Admin</a>
        </div>
      </section>
    `;
  }

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page?.seoTitle || settings.site_name || 'Mijn Website'}</title>
  <meta name="description" content="${page?.metaDescription || settings.site_description || ''}">
  <meta property="og:title" content="${page?.ogTitle || settings.site_name || 'Mijn Website'}">
  <meta property="og:description" content="${page?.ogDescription || settings.site_description || ''}">
  ${page?.ogImage ? `<meta property="og:image" content="/uploads/${page.ogImage}">` : ''}
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  ${favicon ? `<link rel="icon" href="/uploads/${favicon}">` : ''}
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .prose { @apply text-gray-700 leading-relaxed; }
    .prose h1 { @apply text-3xl md:text-4xl font-bold text-gray-900 mb-4 mt-8; }
    .prose h2 { @apply text-2xl md:text-3xl font-bold text-gray-900 mb-3 mt-8; }
    .prose h3 { @apply text-xl md:text-2xl font-bold text-gray-900 mb-2 mt-6; }
    .prose p { @apply mb-4; }
    .prose a { @apply text-blue-600 hover:text-blue-700 underline; }
    .prose ul { @apply list-disc list-inside mb-4; }
    .prose ol { @apply list-decimal list-inside mb-4; }
    .prose blockquote { @apply border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4; }
    .prose img { @apply max-w-full h-auto rounded-lg my-4; }
    .prose code { @apply bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono; }
    .prose pre { @apply bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4; }
    .prose pre code { @apply bg-transparent p-0 text-inherit; }
  </style>
</head>
<body class="bg-white min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Hoofdnavigatie">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          ${logo ? `<a href="/" class="flex items-center"><img src="/uploads/${logo}" alt="${siteName}" class="h-10 w-auto"></a>` : `<a href="/" class="text-xl font-bold text-gray-900">${siteName}</a>`}
        </div>
        <div class="hidden md:block">
          <ul class="flex items-center space-x-1">${navHtml}</ul>
        </div>
        <div class="md:hidden">
          <button id="mobileMenuBtn" class="p-2 text-gray-600 hover:text-gray-900" aria-label="Menu openen">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>
      <div id="mobileMenu" class="md:hidden hidden py-4 border-t border-gray-200">
        <ul class="flex flex-col space-y-2">${navHtml}</ul>
      </div>
    </nav>
  </header>

  <main class="flex-1">${contentHtml}</main>

  <footer class="bg-gray-900 text-gray-300 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          ${logo ? `<img src="/uploads/${logo}" alt="${siteName}" class="h-10 w-auto mb-4">` : `<h3 class="text-white text-lg font-bold mb-4">${siteName}</h3>`}
          <p class="text-sm">${footerText}</p>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Contact</h4>
          <address class="not-italic text-sm space-y-2">
            ${contactEmail ? `<p><a href="mailto:${contactEmail}" class="hover:text-blue-400 transition-colors">${contactEmail}</a></p>` : ''}
            ${contactPhone ? `<p><a href="tel:${contactPhone}" class="hover:text-blue-400 transition-colors">${contactPhone}</a></p>` : ''}
            ${contactAddress ? `<p>${contactAddress}</p>` : ''}
          </address>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Navigatie</h4>
          <ul class="space-y-2 text-sm">
            ${navPages.map((p: any) => `<li><a href="/${p.slug}" class="hover:text-blue-400 transition-colors">${p.title}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Volg ons</h4>
          <div class="flex space-x-4">${socialHtml}</div>
        </div>
      </div>
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
        <p>© ${new Date().getFullYear()} ${siteName}. Alle rechten voorbehouden.</p>
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      const menu = document.getElementById('mobileMenu');
      menu.classList.toggle('hidden');
    });
  </script>
</body></html>`;
}

function renderBlock(block: any, settings: any): string {
  const c = block.content || {};
  
  switch (block.type) {
    case 'HEADING':
      return `<section class="py-8"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><h${c.level || 2} class="text-${c.size || '3xl'} font-bold text-gray-900 text-${c.align || 'left'}">${escapeHtml(c.text || '')}</h${c.level || 2}></div></section>`;
    
    case 'TEXT':
      return `<section class="py-8"><div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose text-${c.align || 'left'}">${renderRichText(c.content || '')}</div></section>`;
    
    case 'IMAGE':
      return `<section class="py-8"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-${c.align || 'center'}">${c.mediaId ? `<img src="/uploads/${c.mediaId}" alt="${escapeHtml(c.alt || '')}" class="max-w-full h-auto rounded-lg${c.width ? ` w-${c.width}` : ''}" loading="lazy">` : '<div class="text-gray-400 italic">Afbeelding niet gevonden</div>'}</div></section>`;
    
    case 'BUTTON':
      return `<section class="py-8"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-${c.align || 'center'}">${c.url ? `<a href="${escapeHtml(c.url)}" class="inline-block px-6 py-3 rounded-lg font-medium transition-colors ${getButtonStyle(c.style)}"${c.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(c.text || 'Knop')}</a>` : `<span class="text-gray-400">Knop zonder link</span>`}</div></section>`;
    
    case 'LINK':
      return `<section class="py-4"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-${c.align || 'left'}">${c.url ? `<a href="${escapeHtml(c.url)}" class="text-blue-600 hover:text-blue-700 underline"${c.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(c.text || c.url)}</a>` : `<span class="text-gray-400">Link zonder URL</span>`}</div></section>`;
    
    case 'VIDEO':
      return `<section class="py-8"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${c.url ? `<div class="aspect-video rounded-lg overflow-hidden">${c.url.includes('youtube') || c.url.includes('vimeo') ? `<iframe src="${escapeHtml(c.url)}" frameborder="0" allowfullscreen class="w-full h-full"></iframe>` : `<video src="${escapeHtml(c.url)}" controls class="w-full h-full"></video>`}</div>` : '<div class="text-gray-400 italic">Geen video URL</div>'}</div></section>`;
    
    case 'HERO':
      return `<section class="relative py-20 md:py-32 ${c.backgroundColor ? `bg-${c.backgroundColor}` : 'bg-gray-50'}"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-${c.align || 'center'}">${c.badge ? `<span class="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mb-4">${escapeHtml(c.badge)}</span>` : ''}${c.title ? `<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">${escapeHtml(c.title)}</h1>` : ''}${c.subtitle ? `<p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">${escapeHtml(c.subtitle)}</p>` : ''}${c.primaryButton && c.primaryButton.url ? `<a href="${escapeHtml(c.primaryButton.url)}" class="inline-block px-8 py-4 rounded-lg font-semibold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors mr-4 mb-4">${escapeHtml(c.primaryButton.text)}</a>` : ''}${c.secondaryButton && c.secondaryButton.url ? `<a href="${escapeHtml(c.secondaryButton.url)}" class="inline-block px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors mb-4">${escapeHtml(c.secondaryButton.text)}</a>` : ''}</div></section>`;
    
    case 'TWO_COLUMNS':
      return `<section class="py-12"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="grid grid-cols-1 md:grid-cols-2 gap-8">${(c.left ? renderColumnContent(c.left, settings) : '')}${c.right ? renderColumnContent(c.right, settings) : ''}</div></div></section>`;
    
    case 'THREE_COLUMNS':
      return `<section class="py-12"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="grid grid-cols-1 md:grid-cols-3 gap-8">${[c.col1, c.col2, c.col3].filter(Boolean).map((col: any) => renderColumnContent(col, settings)).join('')}</div></div></section>`;
    
    case 'SPACER':
      return `<div class="h-${c.size || 16}"></div>`;
    
    case 'DIVIDER':
      return `<hr class="border-t-2 border-gray-200 my-8 mx-auto max-w-3xl">`;
    
    case 'HTML':
      return `<section class="py-8"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${c.content || ''}</div></section>`;
    
    default:
      return '';
  }
}

function renderColumnContent(col: any, settings: any): string {
  if (!col) return '';
  let html = '';
  if (col.mediaId) html += `<img src="/uploads/${col.mediaId}" alt="${escapeHtml(col.alt || '')}" class="w-full h-auto rounded-lg mb-4" loading="lazy">`;
  if (col.title) html += `<h3 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(col.title)}</h3>`;
  if (col.content) html += `<div class="prose text-sm">${renderRichText(col.content)}</div>`;
  if (col.buttonText && col.buttonUrl) html += `<a href="${escapeHtml(col.buttonUrl)}" class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">${escapeHtml(col.buttonText)}</a>`;
  return `<div>${html}</div>`;
}

function renderRichText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getButtonStyle(style?: string): string {
  switch (style) {
    case 'outline': return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50';
    case 'ghost': return 'text-blue-600 hover:bg-blue-50';
    default: return 'bg-blue-600 text-white hover:bg-blue-700';
  }
}

function getSocialIcon(name: string): string {
  const icons: Record<string, string> = {
    facebook: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    twitter: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    instagram: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-.536-.072-4.948-.072zM12 0C8.741 0 8.335.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.335 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.354 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.78-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.058-.536-.072-4.948-.072z"/></svg>',
    linkedin: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    youtube: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  };
  return icons[name] || '';
}

function render404(user: any): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagina niet gevonden</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
  <div class="text-center">
    <h1 class="text-6xl font-bold text-gray-900">404</h1>
    <p class="text-xl text-gray-600 mt-4">Pagina niet gevonden</p>
    <a href="/" class="inline-block mt-6 text-blue-600 hover:text-blue-700 font-medium">Terug naar home</a>
  </div>
</body></html>`;
}

export default router;
