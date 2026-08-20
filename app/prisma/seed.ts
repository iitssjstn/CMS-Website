import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../src/utils/slug';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default pages (only if no pages exist)
  const pageCount = await prisma.page.count();
  if (pageCount === 0) {
    const defaultPages = [
      {
        title: 'Hoofdpagina',
        slug: '/',
        status: 'PUBLISHED' as const,
        content: [
          {
            id: 'hero-1',
            type: 'HERO',
            content: {
              title: 'Welkom bij onze website',
              subtitle: 'Een professionele website gebouwd met onze eigen CMS',
              badge: 'Nieuw',
              backgroundColor: 'blue-50',
              align: 'center',
              primaryButton: { text: 'Ontdek meer', url: '/over-ons' },
              secondaryButton: { text: 'Contact', url: '/contact' },
            },
            sortOrder: 1,
          },
          {
            id: 'text-1',
            type: 'TEXT',
            content: {
              content: 'Dit is de **hoofdpagina** van onze website. Je kunt deze volledig aanpassen via de page builder in het admin paneel.\n\nVoeg nieuwe blokken toe zoals kopteksten, afbeeldingen, knoppen, video\'s en meer.',
              align: 'left',
            },
            sortOrder: 2,
          },
          {
            id: 'three-cols-1',
            type: 'THREE_COLUMNS',
            content: {
              col1: {
                title: 'Eenvoudig beheren',
                content: 'Beheer je website zonder technische kennis.',
                buttonText: 'Lees meer',
                buttonUrl: '/over-ons',
              },
              col2: {
                title: 'Responsive design',
                content: 'Werkt perfect op mobiel, tablet en desktop.',
                buttonText: 'Lees meer',
                buttonUrl: '/diensten',
              },
              col3: {
                title: 'Veilig & snel',
                content: 'Moderne beveiliging en optimale prestaties.',
                buttonText: 'Lees meer',
                buttonUrl: '/contact',
              },
            },
            sortOrder: 3,
          },
        ],
        seoTitle: 'Hoofdpagina - Mijn Website',
        metaDescription: 'Welkom op onze professionele website.',
        sortOrder: 1,
        publishedAt: new Date(),
      },
      {
        title: 'Tweede Pagina',
        slug: 'pagina-2',
        status: 'PUBLISHED' as const,
        content: [
          {
            id: 'heading-1',
            type: 'HEADING',
            content: { text: 'Onze Tweede Pagina', level: 2, size: '3xl', align: 'left' },
            sortOrder: 1,
          },
          {
            id: 'text-2',
            type: 'TEXT',
            content: {
              content: 'Dit is een **voorbeeldpagina** om te laten zien hoe de CMS werkt. Je kunt onbeperkt pagina\'s aanmaken en deze volledig aanpassen met de drag-and-drop page builder.',
              align: 'left',
            },
            sortOrder: 2,
          },
          {
            id: 'two-cols-1',
            type: 'TWO_COLUMNS',
            content: {
              left: {
                title: 'Linkerkolom',
                content: 'Hier kan je inhoud zetten voor de linkerkolom. **Vetgedrukte tekst**, *cursieve tekst* en `code` worden ondersteund.',
                buttonText: 'Actie',
                buttonUrl: '#',
              },
              right: {
                title: 'Rechterkolom',
                content: 'En hier de rechterkolom. Je kunt ook afbeeldingen toevoegen aan kolommen.',
                buttonText: 'Meer info',
                buttonUrl: '#',
              },
            },
            sortOrder: 3,
          },
        ],
        seoTitle: 'Tweede Pagina - Mijn Website',
        metaDescription: 'Een voorbeeldpagina van onze CMS.',
        sortOrder: 2,
        publishedAt: new Date(),
      },
      {
        title: 'Contact',
        slug: 'contact',
        status: 'PUBLISHED' as const,
        content: [
          {
            id: 'heading-contact',
            type: 'HEADING',
            content: { text: 'Contacteer ons', level: 2, size: '3xl', align: 'center' },
            sortOrder: 1,
          },
          {
            id: 'text-contact',
            type: 'TEXT',
            content: {
              content: 'Heb je een vraag of wil je samenwerken? Vul het formulier in en we nemen zo snel mogelijk contact met je op.',
              align: 'center',
            },
            sortOrder: 2,
          },
          {
            id: 'divider-1',
            type: 'DIVIDER',
            content: {},
            sortOrder: 3,
          },
          {
            id: 'html-contact',
            type: 'HTML',
            content: {
              content: `
<form action="/contact" method="POST" class="max-w-xl mx-auto space-y-4" id="contactForm">
  <input type="hidden" name="honeypot" value="">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
    <input type="text" name="name" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
    <input type="email" name="email" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Onderwerp *</label>
    <input type="text" name="subject" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Bericht *</label>
    <textarea name="message" rows="5" required class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
  </div>
  <button type="submit" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">Verzenden</button>
  <p id="formMessage" class="text-sm text-center hidden"></p>
</form>
<script>
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type=submit]');
  const msg = document.getElementById('formMessage');
  btn.disabled = true;
  btn.textContent = 'Verzenden...';
  msg.classList.add('hidden');
  
  const formData = new FormData(form);
  try {
    const res = await fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) {
      msg.textContent = 'Bericht verstuurd! We nemen zo snel mogelijk contact op.';
      msg.className = 'text-sm text-center text-green-600';
      form.reset();
    } else {
      throw new Error('Verzenden mislukt');
    }
  } catch {
    msg.textContent = 'Er ging iets mis. Probeer het later opnieuw.';
    msg.className = 'text-sm text-center text-red-600';
  }
  msg.classList.remove('hidden');
  btn.disabled = false;
  btn.textContent = 'Verzenden';
});
</script>
              `,
            },
            sortOrder: 4,
          },
        ],
        seoTitle: 'Contact - Mijn Website',
        metaDescription: 'Neem contact met ons op via het contactformulier.',
        sortOrder: 3,
        publishedAt: new Date(),
      },
    ];

    for (const pageData of defaultPages) {
      await prisma.page.create({
        data: {
          ...pageData,
          authorId: 'system', // Will be updated after admin creation
        },
      });
    }
    console.log('✅ Default pages created');
  } else {
    console.log('📄 Pages already exist, skipping seed');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
