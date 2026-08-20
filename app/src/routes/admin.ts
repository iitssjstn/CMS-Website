import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '@/middleware/auth';
import { asyncHandler } from '@/utils/errors';

const router: Router = Router();

router.use(requireAuth);

router.get('/', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

router.get('/pages', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

router.get('/pages/new', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

router.get('/pages/:id', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

router.get('/media', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

router.get('/settings', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

router.get('/messages', (req: Request, res: Response) => {
  res.send(adminHtml(req.csrfToken?.() || ''));
});

function adminHtml(csrfToken: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CMS Admin</title>
  <meta name="csrf-token" content="${csrfToken}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    [x-cloak] { display: none !important; }
    .sortable-ghost { opacity: 0.4; background: #e0e7ff; }
    .sortable-chosen { background: #fef3c7; }
    .drag-handle { cursor: grab; }
    .drag-handle:active { cursor: grabbing; }
    .block-editor { transition: all 0.2s ease; }
    .block-editor:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .media-grid img { transition: transform 0.2s; }
    .media-grid img:hover { transform: scale(1.02); }
    .toast { animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
    .modal-overlay { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  </style>
</head>
<body class="bg-gray-50" x-data="adminApp()" x-init="init()">
  <div x-show="sidebarOpen" x-transition class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="sidebarOpen = false" aria-hidden="true"></div>
  <div class="flex h-screen overflow-hidden">
    <aside x-show="!sidebarOpen" x-transition class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform lg:translate-x-0 transition-transform duration-200 ease-in-out" :class="{ '-translate-x-full': sidebarOpen }" aria-label="Hoofdmenu">
      <div class="flex flex-col h-full">
        <div class="p-4 border-b border-gray-200"><a href="/admin" class="text-xl font-bold text-gray-900">CMS Admin</a></div>
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigatie">
          <a href="/admin" class="nav-link" @click.prevent="navigate('dashboard')"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>Dashboard</a>
          <a href="/admin/pages" class="nav-link" @click.prevent="navigate('pages')"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Pagina's</a>
          <a href="/admin/media" class="nav-link" @click.prevent="navigate('media')"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>Media</a>
          <a href="/admin/settings" class="nav-link" @click.prevent="navigate('settings')"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Instellingen</a>
          <a href="/admin/messages" class="nav-link" @click.prevent="navigate('messages')"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h4M8 12a2 2 0 110-4 2 2 0 010 4zm0 0a2 2 0 100-4 2 2 0 000 4zm-5 7a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-1.752 1.976L12 21.5 5.752 18.976A2 2 0 013 17v3a2 2 0 01-2 2zm16 0a2 2 0 01-2 2H3a2 2 0 01-2-2v-3a2 2 0 01.752-1.976L12 2.5 16.248 5.024A2 2 0 0118 7v3a2 2 0 01-2 2z"></path></svg>Berichten</a>
        </nav>
        <div class="p-4 border-t border-gray-200">
          <a href="/" target="_blank" class="nav-link"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>Website bekijken</a>
          <button @click="logout" class="w-full mt-2 nav-link text-red-600 hover:bg-red-50"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>Uitloggen</button>
        </div>
      </div>
    </aside>

    <main class="flex-1 lg:ml-0 overflow-y-auto">
      <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6">
          <button @click="sidebarOpen = true" class="lg:hidden p-2 text-gray-600 hover:text-gray-900" aria-label="Menu openen"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
          <div class="flex-1 lg:flex-none"><h1 x-text="pageTitle" class="text-lg font-semibold text-gray-900">Dashboard</h1></div>
          <div class="flex items-center space-x-4"><span class="text-sm text-gray-500 hidden sm:block" x-text="userName"></span></div>
        </div>
      </header>

      <div class="p-4 sm:p-6 lg:p-8" x-cloak>
        <!-- DASHBOARD -->
        <template x-if="currentView === 'dashboard'">
          <div class="mb-6"><h2 class="text-2xl font-bold text-gray-900">Dashboard</h2><p class="text-gray-600">Overzicht van je website</p></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-xl border border-gray-200 p-6 flex items-center space-x-4"><div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><p class="text-sm text-gray-500">Totaal pagina's</p><p class="text-2xl font-bold text-gray-900" x-text="stats.totalPages"></p></div></div>
            <div class="bg-white rounded-xl border border-gray-200 p-6 flex items-center space-x-4"><div class="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p class="text-sm text-gray-500">Gepubliceerd</p><p class="text-2xl font-bold text-gray-900" x-text="stats.publishedPages"></p></div></div>
            <div class="bg-white rounded-xl border border-gray-200 p-6 flex items-center space-x-4"><div class="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><p class="text-sm text-gray-500">Concepten</p><p class="text-2xl font-bold text-gray-900" x-text="stats.draftPages"></p></div></div>
            <div class="bg-white rounded-xl border border-gray-200 p-6 flex items-center space-x-4"><div class="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><div><p class="text-sm text-gray-500">Afbeeldingen</p><p class="text-2xl font-bold text-gray-900" x-text="stats.mediaCount"></p></div></div>
          </div>
          <div class="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recente pagina's</h3>
            <div x-show="recentPages.length === 0" class="text-center py-8 text-gray-500">Geen pagina's. <a href="/admin/pages/new" class="text-blue-600 hover:underline">Maak eerste pagina</a></div>
            <div class="overflow-x-auto" x-show="recentPages.length > 0">
              <table class="w-full"><thead><tr class="text-left text-sm text-gray-500 border-b border-gray-200"><th class="pb-3 px-4">Titel</th><th class="pb-3 px-4">Status</th><th class="pb-3 px-4">Laatst gewijzigd</th><th class="pb-3 px-4">Acties</th></tr></thead>
                <tbody class="divide-y divide-gray-100"><template x-for="page in recentPages" :key="page.id"><tr class="hover:bg-gray-50">
                  <td class="py-4 px-4"><a :href="'/admin/pages/' + page.id" class="font-medium text-gray-900 hover:text-blue-600" x-text="page.title"></a></td>
                  <td class="py-4 px-4"><span :class="page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="px-2 py-1 text-xs font-medium rounded-full" x-text="page.status === 'PUBLISHED' ? 'Gepubliceerd' : 'Concept'"></span></td>
                  <td class="py-4 px-4 text-sm text-gray-500" x-text="formatDate(page.updatedAt)"></td>
                  <td class="py-4 px-4"><div class="flex items-center space-x-2"><a :href="'/admin/pages/' + page.id" class="text-blue-600 hover:underline text-sm">Bewerken</a><button @click="duplicatePage(page.id)" class="text-gray-600 hover:text-gray-900 text-sm">Dupliceren</button><button @click="deletePage(page.id, page.title)" class="text-red-600 hover:text-red-900 text-sm">Verwijderen</button></div></td>
                </tr></template></tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- PAGES LIST -->
        <template x-if="currentView === 'pages'">
          <div class="flex items-center justify-between mb-6"><div><h2 class="text-2xl font-bold text-gray-900">Pagina's</h2><p class="text-gray-600">Beheer alle pagina's</p></div><a href="/admin/pages/new" class="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700">Nieuwe pagina</a></div>
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div x-show="pages.length === 0" class="text-center py-12 text-gray-500">Geen pagina's. <a href="/admin/pages/new" class="text-blue-600 hover:underline">Maak eerste pagina</a></div>
            <div class="overflow-x-auto" x-show="pages.length > 0"><table class="w-full"><thead><tr class="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50"><th class="p-4">Titel</th><th class="p-4">Slug</th><th class="p-4">Status</th><th class="p-4">Laatst gewijzigd</th><th class="p-4 w-40">Acties</th></tr></thead><tbody class="divide-y divide-gray-100"><template x-for="page in pages" :key="page.id"><tr class="hover:bg-gray-50">
              <td class="p-4"><a :href="'/admin/pages/' + page.id" class="font-medium text-gray-900 hover:text-blue-600" x-text="page.title"></a></td>
              <td class="p-4 text-sm text-gray-500 font-mono" x-text="'/' + page.slug"></td>
              <td class="p-4"><span :class="page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="px-2 py-1 text-xs font-medium rounded-full" x-text="page.status === 'PUBLISHED' ? 'Gepubliceerd' : 'Concept'"></span></td>
              <td class="p-4 text-sm text-gray-500" x-text="formatDate(page.updatedAt)"></td>
              <td class="p-4"><div class="flex items-center space-x-2"><a :href="'/admin/pages/' + page.id" class="text-blue-600 hover:underline text-sm">Bewerken</a><button @click="duplicatePage(page.id)" class="text-gray-600 hover:text-gray-900 text-sm">Dupliceren</button><button @click="deletePage(page.id, page.title)" class="text-red-600 hover:text-red-900 text-sm">Verwijderen</button></div></td>
            </tr></template></tbody></table></div>
          </div>
        </template>

        <!-- PAGE EDITOR -->
        <template x-if="currentView === 'page-editor'">
          <div x-show="saving" class="fixed top-16 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">Opslaan...</div>
          <div x-show="saved" class="fixed top-16 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">Opgeslagen!</div>
          <div class="mb-6 flex items-center justify-between"><div><h2 class="text-2xl font-bold text-gray-900" x-text="editingPage ? 'Pagina bewerken' : 'Nieuwe pagina'"></h2><p class="text-gray-600" x-text="editingPage ? 'Wijzig inhoud en instellingen' : 'Maak een nieuwe pagina aan'"></p></div><div class="flex items-center space-x-3"><button @click="savePage('DRAFT')" class="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Opslaan als concept</button><button @click="savePage('PUBLISHED')" class="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700">Publiceren</button><a :href="editingPage ? '/' + currentPage.slug : '#'" target="_blank" class="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hidden sm:block" x-show="editingPage">Bekijken</a></div></div>
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="lg:col-span-3 space-y-6">
              <div class="bg-white rounded-xl border border-gray-200 p-6"><h3 class="text-lg font-semibold text-gray-900 mb-4">Pagina-instellingen</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">Titel *</label><input type="text" x-model="pageData.title" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label><div class="flex items-center"><span class="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">/</span><input type="text" x-model="pageData.slug" class="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500" required></div></div><div><label class="block text-sm font-medium text-gray-700 mb-1">SEO Titel</label><input type="text" x-model="pageData.seoTitle" maxlength="60" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label><input type="text" x-model="pageData.metaDescription" maxlength="160" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></div><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Open Graph Afbeelding</label><button type="button" @click="openMediaPicker('ogImage')" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-left"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span x-text="pageData.ogImage ? 'Afbeelding geselecteerd' : 'Kies afbeelding'"></span></button><input type="hidden" x-model="pageData.ogImage"></div></div></div>

              <div class="bg-white rounded-xl border border-gray-200"><div class="p-4 border-b border-gray-200 flex items-center justify-between"><h3 class="text-lg font-semibold text-gray-900">Page Builder</h3><div class="flex items-center space-x-2"><select x-model="selectedBlockType" @change="addBlock" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"><option value="">+ Blok toevoegen</option><option value="HEADING">Koptekst</option><option value="TEXT">Tekst</option><option value="IMAGE">Afbeelding</option><option value="BUTTON">Knop</option><option value="LINK">Link</option><option value="VIDEO">Video</option><option value="HERO">Hero/Banner</option><option value="TWO_COLUMNS">Twee kolommen</option><option value="THREE_COLUMNS">Drie kolommen</option><option value="SPACER">Witruimte</option><option value="DIVIDER">Scheiding</option><option value="HTML">HTML</option></select></div></div><div class="p-4 space-y-4" id="blocksContainer" x-ref="blocksContainer"><template x-for="(block, index) in pageData.content" :key="block.id"><div class="block-editor border border-gray-200 rounded-lg overflow-hidden" x-data="blockEditor(block, index)"><div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between"><div class="flex items-center space-x-2"><button class="drag-handle p-2 text-gray-400 hover:text-gray-600" aria-label="Verslepen"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg></button><span class="font-medium text-gray-900 capitalize" x-text="blockTypeLabel"></span><span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded" x-text="block.id.slice(0,8)"></span></div><div class="flex items-center space-x-1"><button @click="duplicateBlock" class="p-2 text-gray-500 hover:text-gray-700 rounded" title="Dupliceren"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button><button @click="removeBlock" class="p-2 text-gray-500 hover:text-red-600 rounded" title="Verwijderen"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div><div class="p-4" x-html="renderEditor()"></div></div></template><div x-show="pageData.content.length === 0" class="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg"><svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p>Nog geen blokken. Kies hierboven een bloktype.</p></div></div>
            </div>
            <div class="space-y-6"><div class="bg-white rounded-xl border border-gray-200 p-6 sticky top-24"><h3 class="text-lg font-semibold text-gray-900 mb-4">Publiceren</h3><div class="space-y-3"><div class="flex items-center justify-between"><span class="text-sm text-gray-600">Status</span><span :class="pageData.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="px-2 py-1 text-xs font-medium rounded-full" x-text="pageData.status === 'PUBLISHED' ? 'Gepubliceerd' : 'Concept'"></span></div><div class="pt-3 border-t border-gray-200"><button @click="savePage('DRAFT')" class="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Opslaan als concept</button><button @click="savePage('PUBLISHED')" class="w-full mt-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm">Publiceren</button></div></div></div><div class="bg-white rounded-xl border border-gray-200 p-6 sticky top-24" style="top: 200px;"><h3 class="text-lg font-semibold text-gray-900 mb-4">SEO</h3><div class="space-y-3 text-sm"><div><span class="text-gray-500">SEO Titel:</span> <span class="ml-2 text-gray-900 font-mono" x-text="pageData.seoTitle || 'Niet ingesteld (valt terug op paginatitel)'"></span></div><div><span class="text-gray-500">Meta Description:</span> <span class="ml-2 text-gray-900 font-mono" x-text="pageData.metaDescription || 'Niet ingesteld'"></span></div><div><span class="text-gray-500">OG Afbeelding:</span> <span class="ml-2 text-gray-900" x-text="pageData.ogImage ? 'Geselecteerd' : 'Niet ingesteld'"></span></div></div></div></div>
          </div>
        </template>

        <!-- MEDIA LIBRARY -->
        <template x-if="currentView === 'media'">
          <div class="flex items-center justify-between mb-6"><div><h2 class="text-2xl font-bold text-gray-900">Mediabibliotheek</h2><p class="text-gray-600">Beheer je afbeeldingen</p></div><label class="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 cursor-pointer flex items-center space-x-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg><span>Uploaden</span><input type="file" accept="image/*" @change="uploadMedia($event)" class="hidden" ref="fileInput"></label></div>
          <div x-show="mediaLoading" class="text-center py-12">Laden...</div>
          <div x-show="!mediaLoading && media.length === 0" class="text-center py-12 text-gray-500">Geen afbeeldingen. Klik op Uploaden om te beginnen.</div>
          <div class="media-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" x-show="!mediaLoading && media.length > 0"><template x-for="item in media" :key="item.id"><div class="relative group bg-white rounded-lg border border-gray-200 overflow-hidden"><img :src="'/uploads/' + item.filename" :alt="item.alt || item.originalName" class="w-full h-32 object-cover" loading="lazy"><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2"><div class="bg-white rounded-lg p-2 space-x-1"><button @click="selectMedia(item.id)" class="p-2 text-gray-700 hover:bg-gray-100 rounded" title="Selecteren"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></button><button @click="editMedia(item)" class="p-2 text-gray-700 hover:bg-gray-100 rounded" title="Bewerken"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button><button @click="deleteMedia(item.id, item.originalName)" class="p-2 text-gray-500 hover:text-red-600 rounded" title="Verwijderen"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div><div class="p-2"><p class="text-xs text-gray-600 truncate" x-text="item.originalName"></p></div></div></template></div>
        </template>

        <!-- SETTINGS -->
        <template x-if="currentView === 'settings'">
          <div class="mb-6"><h2 class="text-2xl font-bold text-gray-900">Instellingen</h2><p class="text-gray-600">Configureer je website</p></div>
          <div class="bg-white rounded-xl border border-gray-200 p-6"><form @submit.prevent="saveSettings" class="space-y-6"><template x-for="group in settingsGroups" :key="group.key"><div><h3 class="text-lg font-semibold text-gray-900 mb-4 capitalize" x-text="group.label"></h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><template x-for="setting in group.settings" :key="setting.key"><div class="md:col-span-1" :class="setting.type === 'IMAGE' ? 'md:col-span-2' : ''"><label class="block text-sm font-medium text-gray-700 mb-1" x-text="setting.label"></label><template x-if="setting.type === 'IMAGE'"><button type="button" @click="openMediaPicker('settings.' + setting.key)" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-left"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span x-text="settingsData[setting.key] ? 'Afbeelding geselecteerd' : 'Kies afbeelding'"></span></button><input type="hidden" :name="setting.key" x-model="settingsData[setting.key]"><template x-if="settingsData[setting.key]"><div class="mt-2 flex items-center space-x-2"><img :src="'/uploads/' + settingsData[setting.key]" class="w-16 h-16 object-cover rounded"><button type="button" @click="settingsData[setting.key] = ''" class="text-red-600 hover:text-red-900 text-sm">Verwijderen</button></div></template></template><template x-if="setting.type !== 'IMAGE'"><input type="text" :name="setting.key" x-model="settingsData[setting.key]" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" :placeholder="setting.description || ''"><template x-if="setting.description"><p class="mt-1 text-xs text-gray-500" x-text="setting.description"></p></template></template></div></template></div></div></template><div class="pt-4 border-t border-gray-200"><button type="submit" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700">Instellingen opslaan</button></div></form></div>
        </template>

        <!-- MESSAGES -->
        <template x-if="currentView === 'messages'">
          <div class="mb-6"><h2 class="text-2xl font-bold text-gray-900">Contactberichten</h2><p class="text-gray-600">Inkomende berichten via het contactformulier</p></div>
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden"><div x-show="messages.length === 0" class="text-center py-12 text-gray-500">Geen berichten.</div><div class="overflow-x-auto" x-show="messages.length > 0"><table class="w-full"><thead><tr class="text-left text-sm text-gray-500 border-b border-gray-200 bg-gray-50"><th class="p-4">Naam</th><th class="p-4">E-mail</th><th class="p-4">Onderwerp</th><th class="p-4">Ontvangen</th><th class="p-4">Status</th><th class="p-4 w-24">Acties</th></tr></thead><tbody class="divide-y divide-gray-100"><template x-for="msg in messages" :key="msg.id"><tr class="hover:bg-gray-50" :class="msg.isRead ? '' : 'bg-blue-50'"><td class="p-4 font-medium text-gray-900" x-text="msg.name"></td><td class="p-4 text-sm text-gray-500" x-text="msg.email"></td><td class="p-4 text-gray-700" x-text="msg.subject"></td><td class="p-4 text-sm text-gray-500" x-text="formatDate(msg.createdAt)"></td><td class="p-4"><span :class="msg.isRead ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'" class="px-2 py-1 text-xs font-medium rounded-full" x-text="msg.isRead ? 'Gelezen' : 'Nieuw'"></span></td><td class="p-4"><button @click="markRead(msg.id)" class="text-blue-600 hover:underline text-sm" x-show="!msg.isRead">Markeren als gelezen</button><button @click="deleteMessage(msg.id)" class="text-red-600 hover:text-red-900 text-sm">Verwijderen</button></td></tr></template></tbody></table></div></div>
        </template>
      </div>
    </main>
  </div>

  <!-- MEDIA PICKER MODAL -->
  <div x-show="mediaPickerOpen" class="fixed inset-0 z-50 modal-overlay" @click.self="closeMediaPicker"><div class="fixed inset-0 flex items-center justify-center p-4"><div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"><div class="p-4 border-b border-gray-200 flex items-center justify-between"><h3 class="text-lg font-semibold text-gray-900">Afbeelding kiezen</h3><button @click="closeMediaPicker" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div class="p-4 border-b border-gray-200"><label class="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg><span>Nieuwe uploaden</span><input type="file" accept="image/*" @change="uploadMedia($event, true)" class="hidden"></label></div><div class="flex-1 overflow-y-auto p-4"><div x-show="mediaPickerLoading" class="text-center py-12">Laden...</div><div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" x-show="!mediaPickerLoading"><template x-for="item in media" :key="item.id"><button @click="pickMedia(item.id)" class="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-500 transition-colors aspect-square" :class="{ 'ring-2 ring-blue-500': mediaPickerSelected === item.id }"><img :src="'/uploads/' + item.filename" :alt="item.alt || item.originalName" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div></button></template></div></div><div class="p-4 border-t border-gray-200 flex justify-end space-x-2"><button @click="closeMediaPicker" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Annuleren</button><button @click="confirmMediaPick" :disabled="!mediaPickerSelected" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Selecteren</button></div></div></div></div>

  <!-- DELETE CONFIRM MODAL -->
  <div x-show="deleteConfirmOpen" class="fixed inset-0 z-50 modal-overlay" @click.self="closeDeleteConfirm"><div class="fixed inset-0 flex items-center justify-center p-4"><div class="bg-white rounded-xl shadow-xl max-w-md w-full"><div class="p-6"><h3 class="text-lg font-semibold text-gray-900 mb-2" x-text="deleteConfirmTitle"></h3><p class="text-gray-600 mb-6" x-text="deleteConfirmMessage"></p><div class="flex justify-end space-x-3"><button @click="closeDeleteConfirm" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Annuleren</button><button @click="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Verwijderen</button></div></div></div></div></div>

  <!-- TOAST CONTAINER -->
  <div id="toastContainer" class="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite"></div>

  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <script>
    const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || '';

    function adminApp() {
      return {
        currentView: 'dashboard',
        sidebarOpen: false,
        userName: '',
        stats: { totalPages: 0, publishedPages: 0, draftPages: 0, mediaCount: 0 },
        recentPages: [],
        pages: [],
        media: [],
        mediaLoading: false,
        mediaPickerOpen: false,
        mediaPickerLoading: false,
        mediaPickerSelected: null,
        mediaPickerTarget: null,
        deleteConfirmOpen: false,
        deleteConfirmTitle: '',
        deleteConfirmMessage: '',
        deleteConfirmCallback: null,
        editingPage: null,
        currentPage: null,
        pageData: { title: '', slug: '', status: 'DRAFT', content: [], seoTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', ogImage: null, sortOrder: 0 },
        selectedBlockType: '',
        saving: false,
        saved: false,
        settingsGroups: [],
        settingsData: {},
        messages: [],

        async init() {
          await this.loadUser();
          this.initViewFromUrl();
          window.addEventListener('popstate', () => this.initViewFromUrl());
          
          // Listen for media picker events from block editors
          document.addEventListener('open-media-picker', (e) => {
            this.openMediaPicker(e.detail.target);
          });
        },

        initViewFromUrl() {
          const path = window.location.pathname;
          if (path === '/admin' || path === '/admin/') this.navigate('dashboard');
          else if (path === '/admin/pages') this.navigate('pages');
          else if (path.startsWith('/admin/pages/') && path !== '/admin/pages/new') this.openPageEditor(path.split('/')[3]);
          else if (path === '/admin/pages/new') this.openPageEditor('new');
          else if (path === '/admin/media') this.navigate('media');
          else if (path === '/admin/settings') this.navigate('settings');
          else if (path === '/admin/messages') this.navigate('messages');
        },

        navigate(view) {
          this.currentView = view;
          this.sidebarOpen = false;
          const urls = { dashboard: '/admin', pages: '/admin/pages', media: '/admin/media', settings: '/admin/settings', messages: '/admin/messages' };
          if (urls[view]) history.pushState(null, '', urls[view]);
          this.loadViewData(view);
        },

        async loadUser() {
          try {
            const res = await fetch('/admin/api/auth/me');
            if (res.ok) {
              const data = await res.json();
              this.userName = data.user.username;
            }
          } catch {}
        },

        async loadViewData(view) {
          switch (view) {
            case 'dashboard': await this.loadDashboard(); break;
            case 'pages': await this.loadPages(); break;
            case 'media': await this.loadMedia(); break;
            case 'settings': await this.loadSettings(); break;
            case 'messages': await this.loadMessages(); break;
          }
        },

        async loadDashboard() {
          try {
            const [statsRes, pagesRes] = await Promise.all([
              fetch('/admin/api/dashboard/stats'),
              fetch('/admin/api/pages?limit=5')
            ]);
            this.stats = (await statsRes.json()).stats;
            this.recentPages = (await pagesRes.json()).pages;
          } catch (e) { this.showToast('Fout bij laden dashboard', 'error'); }
        },

        async loadPages() {
          try {
            const res = await fetch('/admin/api/pages');
            this.pages = (await res.json()).pages;
          } catch (e) { this.showToast('Fout bij laden pagina\\'s', 'error'); }
        },

        async loadMedia() {
          this.mediaLoading = true;
          try {
            const res = await fetch('/admin/api/media');
            this.media = (await res.json()).media;
          } catch (e) { this.showToast('Fout bij laden media', 'error'); }
          finally { this.mediaLoading = false; }
        },

        async loadSettings() {
          try {
            const res = await fetch('/admin/api/settings');
            const settings = (await res.json()).settings;
            this.settingsGroups = this.groupSettings(settings);
            this.settingsData = Object.fromEntries(settings.map(s => [s.key, s.value]));
          } catch (e) { this.showToast('Fout bij laden instellingen', 'error'); }
        },

        groupSettings(settings) {
          const groups = {};
          for (const s of settings) {
            if (!groups[s.group]) groups[s.group] = { key: s.group, label: s.group, settings: [] };
            groups[s.group].settings.push(s);
          }
          return Object.values(groups);
        },

        async loadMessages() {
          try {
            const res = await fetch('/admin/api/messages');
            this.messages = (await res.json()).messages;
          } catch (e) { this.showToast('Fout bij laden berichten', 'error'); }
        },

        async openPageEditor(id) {
          this.currentView = 'page-editor';
          this.sidebarOpen = false;
          if (id === 'new') {
            history.pushState(null, '', '/admin/pages/new');
            this.editingPage = null;
            this.currentPage = null;
            this.pageData = { title: '', slug: '', status: 'DRAFT', content: [], seoTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', ogImage: null, sortOrder: 0 };
          } else {
            history.pushState(null, '', \`/admin/pages/\${id}\`);
            this.editingPage = id;
            await this.loadPage(id);
          }
        },

        async loadPage(id) {
          try {
            const res = await fetch(\`/admin/api/pages/\${id}\`);
            const data = await res.json();
            this.currentPage = data.page;
            this.pageData = {
              title: data.page.title,
              slug: data.page.slug,
              status: data.page.status,
              content: data.page.blocks || [],
              seoTitle: data.page.seoTitle || '',
              metaDescription: data.page.metaDescription || '',
              ogTitle: data.page.ogTitle || '',
              ogDescription: data.page.ogDescription || '',
              ogImage: data.page.ogImage || null,
              sortOrder: data.page.sortOrder || 0,
            };
            this.initSortable();
          } catch (e) { this.showToast('Fout bij laden pagina', 'error'); }
        },

        initSortable() {
          this.$nextTick(() => {
            const container = this.$refs.blocksContainer;
            if (container && !container.sortable) {
              container.sortable = new Sortable(container, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: (evt) => {
                  const movedBlock = this.pageData.content.splice(evt.oldIndex, 1)[0];
                  this.pageData.content.splice(evt.newIndex, 0, movedBlock);
                  this.pageData.content.forEach((b, i) => b.sortOrder = i);
                }
              });
            }
          });
        },

        addBlock() {
          if (!this.selectedBlockType) return;
          const blockTypes = {
            HEADING: { type: 'HEADING', content: { text: 'Nieuwe koptekst', level: 2, size: '2xl', align: 'left' } },
            TEXT: { type: 'TEXT', content: { content: '', align: 'left' } },
            IMAGE: { type: 'IMAGE', content: { mediaId: null, alt: '', align: 'center', width: null } },
            BUTTON: { type: 'BUTTON', content: { text: 'Knop', url: '', style: 'primary', align: 'center', newTab: false } },
            LINK: { type: 'LINK', content: { text: 'Link', url: '', align: 'left', newTab: false } },
            VIDEO: { type: 'VIDEO', content: { url: '', align: 'center' } },
            HERO: { type: 'HERO', content: { title: 'Hero titel', subtitle: 'Hero ondertitel', badge: '', backgroundColor: 'blue-50', align: 'center', primaryButton: { text: 'Primair', url: '' }, secondaryButton: { text: 'Secundair', url: '' } } },
            TWO_COLUMNS: { type: 'TWO_COLUMNS', content: { left: { title: '', content: '', mediaId: null, buttonText: '', buttonUrl: '' }, right: { title: '', content: '', mediaId: null, buttonText: '', buttonUrl: '' } } },
            THREE_COLUMNS: { type: 'THREE_COLUMNS', content: { col1: { title: '', content: '', mediaId: null, buttonText: '', buttonUrl: '' }, col2: { title: '', content: '', mediaId: null, buttonText: '', buttonUrl: '' }, col3: { title: '', content: '', mediaId: null, buttonText: '', buttonUrl: '' } } },
            SPACER: { type: 'SPACER', content: { size: 16 } },
            DIVIDER: { type: 'DIVIDER', content: {} },
            HTML: { type: 'HTML', content: { content: '' } },
          };
          const newBlock = { id: crypto.randomUUID(), ...blockTypes[this.selectedBlockType], sortOrder: this.pageData.content.length };
          this.pageData.content.push(newBlock);
          this.selectedBlockType = '';
          this.$nextTick(() => this.initSortable());
        },

        async savePage(status) {
          this.saving = true;
          this.saved = false;
          try {
            const data = { ...this.pageData, status };
            const url = this.editingPage ? \`/admin/api/pages/\${this.editingPage}\` : '/admin/api/pages';
            const method = this.editingPage ? 'PATCH' : 'POST';
            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json', 'CSRF-Token': CSRF_TOKEN },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Opslaan mislukt');
            }
            const result = await res.json();
            if (!this.editingPage) {
              this.editingPage = result.page.id;
              history.replaceState(null, '', \`/admin/pages/\${result.page.id}\`);
            }
            this.currentPage = result.page;
            this.pageData.status = status;
            this.saved = true;
            this.showToast(status === 'PUBLISHED' ? 'Pagina gepubliceerd' : 'Concept opgeslagen', 'success');
            setTimeout(() => { this.saved = false; }, 2000);
          } catch (e) {
            this.showToast(e.message || 'Fout bij opslaan', 'error');
          } finally {
            this.saving = false;
          }
        },

        duplicatePage(id) {
          fetch(\`/admin/api/pages/\${id}/duplicate\`, {
            method: 'POST',
            headers: { 'CSRF-Token': CSRF_TOKEN },
          }).then(async (res) => {
            if (!res.ok) throw new Error('Dupliceren mislukt');
            this.showToast('Pagina gedupliceerd', 'success');
            await this.loadPages();
          }).catch((e) => this.showToast(e.message, 'error'));
        },

        deletePage(id, title) {
          this.openDeleteConfirm(
            'Pagina verwijderen',
            \`Weet je zeker dat je "\${title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.\`,
            async () => {
              const res = await fetch(\`/admin/api/pages/\${id}\`, {
                method: 'DELETE',
                headers: { 'CSRF-Token': CSRF_TOKEN },
              });
              if (!res.ok) throw new Error('Verwijderen mislukt');
              this.showToast('Pagina verwijderd', 'success');
              if (this.currentView === 'pages') await this.loadPages();
              else this.navigate('pages');
            }
          );
        },

        openDeleteConfirm(title, message, callback) {
          this.deleteConfirmTitle = title;
          this.deleteConfirmMessage = message;
          this.deleteConfirmCallback = callback;
          this.deleteConfirmOpen = true;
        },

        closeDeleteConfirm() {
          this.deleteConfirmOpen = false;
          this.deleteConfirmCallback = null;
        },

        async confirmDelete() {
          const callback = this.deleteConfirmCallback;
          this.closeDeleteConfirm();
          if (!callback) return;
          try {
            await callback();
          } catch (e) {
            this.showToast(e.message || 'Actie mislukt', 'error');
          }
        },

        async uploadMedia(event, forPicker = false) {
          const file = event.target.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append('file', file);
          try {
            if (forPicker) this.mediaPickerLoading = true;
            const res = await fetch('/admin/api/media/upload', {
              method: 'POST',
              headers: { 'CSRF-Token': CSRF_TOKEN },
              body: formData,
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Upload mislukt');
            }
            const { media } = await res.json();
            this.media.unshift(media);
            this.showToast('Afbeelding geüpload', 'success');
            if (forPicker) this.mediaPickerSelected = media.id;
          } catch (e) {
            this.showToast(e.message, 'error');
          } finally {
            if (forPicker) this.mediaPickerLoading = false;
            event.target.value = '';
          }
        },

        editMedia(item) {
          const alt = prompt('Alt-tekst', item.alt || '');
          if (alt === null) return;
          fetch(\`/admin/api/media/\${item.id}\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'CSRF-Token': CSRF_TOKEN },
            body: JSON.stringify({ alt }),
          }).then(async (res) => {
            if (!res.ok) throw new Error('Bijwerken mislukt');
            item.alt = alt;
            this.showToast('Afbeelding bijgewerkt', 'success');
          }).catch((e) => this.showToast(e.message, 'error'));
        },

        deleteMedia(id, name) {
          this.openDeleteConfirm(
            'Afbeelding verwijderen',
            \`Weet je zeker dat je "\${name}" wilt verwijderen?\`,
            async () => {
              const res = await fetch(\`/admin/api/media/\${id}\`, {
                method: 'DELETE',
                headers: { 'CSRF-Token': CSRF_TOKEN },
              });
              if (!res.ok) throw new Error('Verwijderen mislukt');
              this.media = this.media.filter((m) => m.id !== id);
              this.showToast('Afbeelding verwijderd', 'success');
            }
          );
        },

        selectMedia(id) {
          this.openMediaPicker(null);
          this.mediaPickerSelected = id;
        },

        openMediaPicker(target) {
          this.mediaPickerTarget = target;
          this.mediaPickerSelected = null;
          this.mediaPickerOpen = true;
          if (this.media.length === 0) {
            this.mediaPickerLoading = true;
            this.loadMedia().finally(() => { this.mediaPickerLoading = false; });
          }
        },

        closeMediaPicker() {
          this.mediaPickerOpen = false;
          this.mediaPickerTarget = null;
          this.mediaPickerSelected = null;
        },

        pickMedia(id) {
          this.mediaPickerSelected = id;
        },

        confirmMediaPick() {
          if (!this.mediaPickerSelected || !this.mediaPickerTarget) {
            this.closeMediaPicker();
            return;
          }
          this.setByPath(this.mediaPickerTarget, this.mediaPickerSelected);
          this.closeMediaPicker();
        },

        setByPath(path, value) {
          const parts = path.split('.');
          let obj = this;
          for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
          obj[parts[parts.length - 1]] = value;
        },

        async saveSettings() {
          try {
            const res = await fetch('/admin/api/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'CSRF-Token': CSRF_TOKEN },
              body: JSON.stringify(this.settingsData),
            });
            if (!res.ok) throw new Error('Opslaan mislukt');
            this.showToast('Instellingen opgeslagen', 'success');
          } catch (e) {
            this.showToast(e.message, 'error');
          }
        },

        markRead(id) {
          fetch(\`/admin/api/messages/\${id}/read\`, {
            method: 'PATCH',
            headers: { 'CSRF-Token': CSRF_TOKEN },
          }).then(async (res) => {
            if (!res.ok) throw new Error('Bijwerken mislukt');
            const msg = this.messages.find((m) => m.id === id);
            if (msg) msg.isRead = true;
          }).catch((e) => this.showToast(e.message, 'error'));
        },

        deleteMessage(id) {
          this.openDeleteConfirm(
            'Bericht verwijderen',
            'Weet je zeker dat je dit bericht wilt verwijderen?',
            async () => {
              const res = await fetch(\`/admin/api/messages/\${id}\`, {
                method: 'DELETE',
                headers: { 'CSRF-Token': CSRF_TOKEN },
              });
              if (!res.ok) throw new Error('Verwijderen mislukt');
              this.messages = this.messages.filter((m) => m.id !== id);
              this.showToast('Bericht verwijderd', 'success');
            }
          );
        },

        async logout() {
          try {
            await fetch('/admin/api/auth/logout', { method: 'POST', headers: { 'CSRF-Token': CSRF_TOKEN } });
          } catch {}
          window.location.href = '/admin/api/auth/login';
        },

        formatDate(dateStr) {
          if (!dateStr) return '';
          return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
        },

        showToast(message, type = 'success') {
          const container = document.getElementById('toastContainer');
          if (!container) return;
          const toast = document.createElement('div');
          toast.className = \`toast px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium \${type === 'error' ? 'bg-red-600' : 'bg-gray-900'}\`;
          toast.textContent = message;
          container.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        },
      };
    }

    function blockEditor(block, index) {
      return {
        block,
        index,

        get blockTypeLabel() {
          const labels = {
            HEADING: 'Koptekst', TEXT: 'Tekst', IMAGE: 'Afbeelding', BUTTON: 'Knop', LINK: 'Link',
            VIDEO: 'Video', HERO: 'Hero/Banner', TWO_COLUMNS: 'Twee kolommen', THREE_COLUMNS: 'Drie kolommen',
            SPACER: 'Witruimte', DIVIDER: 'Scheiding', HTML: 'HTML',
          };
          return labels[this.block.type] || this.block.type;
        },

        root() {
          return Alpine.$data(this.$root);
        },

        duplicateBlock() {
          const root = this.root();
          const copy = JSON.parse(JSON.stringify(this.block));
          copy.id = crypto.randomUUID();
          root.pageData.content.splice(this.index + 1, 0, copy);
          root.$nextTick(() => root.initSortable());
        },

        removeBlock() {
          const root = this.root();
          root.pageData.content.splice(this.index, 1);
        },

        field(name) {
          const val = this.block.content?.[name];
          return val === undefined || val === null ? '' : val;
        },

        update(name, value) {
          if (!this.block.content) this.block.content = {};
          this.block.content[name] = value;
        },

        pickImage() {
          document.dispatchEvent(new CustomEvent('open-media-picker', { detail: { target: null } }));
        },

        renderEditor() {
          const c = this.block.content || {};
          const esc = (s) => String(s ?? '').replace(/"/g, '&quot;');
          const row = (label, inputHtml) =>
            \`<div class="mb-3"><label class="block text-xs font-medium text-gray-500 mb-1">\${label}</label>\${inputHtml}</div>\`;
          const textInput = (field, value, placeholder = '') =>
            \`<input type="text" value="\${esc(value)}" placeholder="\${esc(placeholder)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" oninput="Alpine.$data(this.closest('[x-data]')).update('\${field}', this.value)">\`;
          const textArea = (field, value) =>
            \`<textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" oninput="Alpine.$data(this.closest('[x-data]')).update('\${field}', this.value)">\${esc(value)}</textarea>\`;
          const select = (field, value, options) =>
            \`<select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onchange="Alpine.$data(this.closest('[x-data]')).update('\${field}', this.value)">\${options.map(o => \`<option value="\${o[0]}"\${o[0] === value ? ' selected' : ''}>\${o[1]}</option>\`).join('')}</select>\`;

          switch (this.block.type) {
            case 'HEADING':
              return row('Tekst', textInput('text', c.text)) +
                row('Niveau', select('level', c.level || 2, [[1,'H1'],[2,'H2'],[3,'H3'],[4,'H4']])) +
                row('Uitlijning', select('align', c.align || 'left', [['left','Links'],['center','Midden'],['right','Rechts']]));
            case 'TEXT':
              return row('Inhoud', textArea('content', c.content)) +
                row('Uitlijning', select('align', c.align || 'left', [['left','Links'],['center','Midden'],['right','Rechts']]));
            case 'IMAGE':
              return row('Afbeelding', \`<button type="button" onclick="document.dispatchEvent(new CustomEvent('open-media-picker',{detail:{target:'pageData.content.\${this.index}.content.mediaId'}}))" class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Kies afbeelding</button>\`) +
                row('Alt-tekst', textInput('alt', c.alt));
            case 'BUTTON':
              return row('Tekst', textInput('text', c.text)) + row('URL', textInput('url', c.url, 'https://')) +
                row('Stijl', select('style', c.style || 'primary', [['primary','Primair'],['outline','Outline'],['ghost','Ghost']]));
            case 'LINK':
              return row('Tekst', textInput('text', c.text)) + row('URL', textInput('url', c.url, 'https://'));
            case 'VIDEO':
              return row('Video URL', textInput('url', c.url, 'https://youtube.com/...'));
            case 'HERO':
              return row('Titel', textInput('title', c.title)) + row('Ondertitel', textInput('subtitle', c.subtitle)) +
                row('Badge', textInput('badge', c.badge));
            case 'TWO_COLUMNS':
            case 'THREE_COLUMNS':
              return \`<p class="text-sm text-gray-500">Bewerk kolominhoud via de kolomvelden hierboven in de pagina-data.</p>\`;
            case 'SPACER':
              return row('Hoogte (px)', textInput('size', c.size || 16));
            case 'DIVIDER':
              return \`<p class="text-sm text-gray-500">Geen instellingen.</p>\`;
            case 'HTML':
              return row('HTML-inhoud', textArea('content', c.content));
            default:
              return '';
          }
        },
      };
    }
  </script>
</body>
</html>`;
}

export default router;
