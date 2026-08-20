import { Router, Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { hashPassword } from '@/utils/security';
import { setupSchema } from '@/utils/validation';
import { validateBody } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireSetup } from '@/middleware/auth';

const router = Router();

router.get('/', requireSetup, asyncHandler(async (req: Request, res: Response) => {
  const setup = await prisma.setupStatus.findUnique({ where: { id: 'singleton' } });
  
  if (setup?.completed) {
    return res.redirect('/admin/login');
  }

  res.send(`
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eerste setup - CMS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Welkom bij CMS</h1>
      <p class="text-gray-600 mt-2">Maak je eerste administrator account aan</p>
    </div>
    
    <form id="setupForm" class="space-y-6" novalidate>
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
        <input type="text" id="username" name="username" required minlength="3" maxlength="50" pattern="[a-zA-Z0-9_-]+"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="bijv. admin">
        <p class="mt-1 text-xs text-gray-500">Alleen letters, cijfers, _ en -</p>
      </div>
      
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
        <input type="email" id="email" name="email" required maxlength="255"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="jouw@email.com">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
        <input type="password" id="password" name="password" required minlength="12" maxlength="128"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Minimaal 12 tekens">
        <p class="mt-1 text-xs text-gray-500">Minimaal 12 tekens</p>
      </div>
      
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Bevestig wachtwoord</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Herhaal wachtwoord">
      </div>
      
      <button type="submit" id="submitBtn"
        class="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        Administrator aanmaken
      </button>
      
      <p class="text-xs text-gray-500 text-center">
        Dit is een eenmalige actie. Na afronding is <code>/setup</code> permanent geblokkeerd.
      </p>
    </form>
    
    <div id="error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"></div>
    <div id="success" class="hidden mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm"></div>
  </div>

  <script>
    document.getElementById('setupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const submitBtn = document.getElementById('submitBtn');
      const errorDiv = document.getElementById('error');
      const successDiv = document.getElementById('success');
      
      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Bezig...';
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      try {
        const res = await fetch('/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (!res.ok) {
          throw new Error(result.error || 'Setup mislukt');
        }
        
        successDiv.textContent = 'Administrator aangemaakt! Doorverwijzen...';
        successDiv.classList.remove('hidden');
        
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Administrator aanmaken';
      }
    });
  </script>
</body>
</html>
  `);
}));

router.post('/', requireSetup, validateBody(setupSchema), asyncHandler(async (req: Request, res: Response) => {
  const setup = await prisma.setupStatus.findUnique({ where: { id: 'singleton' } });
  
  if (setup?.completed) {
    throw new AppError('Setup al voltooid', 403);
  }

  const adminCount = await prisma.user.count();
  if (adminCount > 0) {
    await prisma.setupStatus.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });
    throw new AppError('Er bestaat al een administrator', 403);
  }

  const { username, email, password } = req.body;
  
  const passwordHash = await hashPassword(password);
  
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        role: 'ADMIN',
      },
    });
    
    await tx.setupStatus.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });
  });

  res.json({ success: true, message: 'Administrator aangemaakt' });
}));

export default router;
