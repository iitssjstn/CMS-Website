import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { verifyPassword, generateSessionId } from '@/utils/security';
import { loginSchema } from '@/utils/validation';
import { validateBody } from '@/middleware/validation';
import { asyncHandler, AppError } from '@/utils/errors';
import { requireNoSetup } from '@/middleware/auth';

const router: Router = Router();
const SESSION_COOKIE_NAME = 'sessionId';
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.APP_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.APP_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

router.get('/login', requireNoSetup, (req: Request, res: Response) => {
  if (req.user) {
    return res.redirect('/admin');
  }

  const csrfToken = req.csrfToken?.() || '';

  res.send(`
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inloggen - CMS Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900">CMS Admin</h1>
      <p class="text-gray-600 mt-2">Log in om je website te beheren</p>
    </div>

    <form id="loginForm" class="space-y-6" novalidate>
      <input type="hidden" name="_csrf" value="${csrfToken}">

      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
        <input type="text" id="username" name="username" required autocomplete="username"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Gebruikersnaam">
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
        <input type="password" id="password" name="password" required autocomplete="current-password"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Wachtwoord">
      </div>

      <button type="submit" id="submitBtn"
        class="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        Inloggen
      </button>
    </form>

    <div id="error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"></div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const form = e.target;
      const submitBtn = document.getElementById('submitBtn');
      const errorDiv = document.getElementById('error');

      errorDiv.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Inloggen...';

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      try {
        const res = await fetch('/admin/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Inloggen mislukt');
        }

        window.location.href = '/admin';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Inloggen';
      }
    });
  </script>
</body>
</html>
  `);
});

router.post(
  '/login',
  requireNoSetup,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      throw new AppError('Ongeldige inloggegevens', 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      throw new AppError('Ongeldige inloggegevens', 401);
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

    await prisma.session.create({
      data: {
        sessionId,
        userId: user.id,
        expiresAt,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    setSessionCookie(res, sessionId);

    res.json({ success: true });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;

    if (sessionId) {
      await prisma.session.deleteMany({ where: { sessionId } });
    }

    clearSessionCookie(res);
    res.json({ success: true });
  })
);

router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Niet geauthenticeerd' });
    }

    const { passwordHash, ...user } = req.user;
    res.json({ user });
  })
);

export default router;
