import { prisma } from '@/utils/database';

const DEFAULT_SETTINGS = [
  { key: 'site_name', value: 'Mijn Website', type: 'STRING', label: 'Website naam', group: 'general', sortOrder: 1 },
  { key: 'site_description', value: 'Een professionele website', type: 'STRING', label: 'Website beschrijving', group: 'general', sortOrder: 2 },
  { key: 'site_logo', value: null, type: 'IMAGE', label: 'Logo', group: 'general', sortOrder: 3 },
  { key: 'favicon', value: null, type: 'IMAGE', label: 'Favicon', group: 'general', sortOrder: 4 },
  { key: 'footer_text', value: '© 2024 Mijn Website. Alle rechten voorbehouden.', type: 'STRING', label: 'Footer tekst', group: 'footer', sortOrder: 1 },
  { key: 'contact_email', value: '', type: 'STRING', label: 'Contact e-mail', group: 'contact', sortOrder: 1 },
  { key: 'contact_phone', value: '', type: 'STRING', label: 'Contact telefoon', group: 'contact', sortOrder: 2 },
  { key: 'contact_address', value: '', type: 'STRING', label: 'Contact adres', group: 'contact', sortOrder: 3 },
  { key: 'social_facebook', value: '', type: 'URL', label: 'Facebook URL', group: 'social', sortOrder: 1 },
  { key: 'social_twitter', value: '', type: 'URL', label: 'Twitter/X URL', group: 'social', sortOrder: 2 },
  { key: 'social_instagram', value: '', type: 'URL', label: 'Instagram URL', group: 'social', sortOrder: 3 },
  { key: 'social_linkedin', value: '', type: 'URL', label: 'LinkedIn URL', group: 'social', sortOrder: 4 },
  { key: 'social_youtube', value: '', type: 'URL', label: 'YouTube URL', group: 'social', sortOrder: 5 },
];

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const settings = await prisma.setting.findMany({
    orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
  });
  
  const result: Record<string, unknown> = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
}

export async function initializeDefaultSettings() {
  const existingCount = await prisma.setting.count();
  if (existingCount > 0) return;

  await prisma.setting.createMany({
    data: DEFAULT_SETTINGS,
    skipDuplicates: true,
  });
}

export async function updateSettings(updates: Record<string, unknown>) {
  const results = await Promise.all(
    Object.entries(updates).map(async ([key, value]) => {
      const setting = await prisma.setting.findUnique({ where: { key } });
      if (setting) {
        return prisma.setting.update({
          where: { key },
          data: { value: value as any },
        });
      }
      return null;
    })
  );
  return results.filter(Boolean);
}
