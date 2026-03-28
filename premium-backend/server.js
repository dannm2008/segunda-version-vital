const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const DEV_PREMIUM_MODE = String(process.env.DEV_PREMIUM_MODE || '').toLowerCase() === 'true';
const PANEL_ACCESS_EMAIL = String(process.env.PANEL_ACCESS_EMAIL || '').trim().toLowerCase();
const PANEL_ACCESS_PASSWORD = String(process.env.PANEL_ACCESS_PASSWORD || '').trim();
const PANEL_ACCESS_PASSWORD_HASH = String(process.env.PANEL_ACCESS_PASSWORD_HASH || '').trim().toLowerCase();

const panelLoginAttempts = new Map();
const PANEL_MAX_ATTEMPTS = Number(process.env.PANEL_MAX_ATTEMPTS || 5);
const PANEL_LOCK_MINUTES = Number(process.env.PANEL_LOCK_MINUTES || 10);

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const intentStore = new Map();

function getNormalizedDbUrl() {
  const dbUrl = process.env.FIREBASE_DB_URL;
  if (!dbUrl) return '';
  return dbUrl.replace(/\/$/, '');
}

async function writeFirebase(path, value) {
  const normalized = getNormalizedDbUrl();
  if (!normalized) return false;

  const response = await fetch(`${normalized}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });

  return response.ok;
}

async function readFirebase(path) {
  const normalized = getNormalizedDbUrl();
  if (!normalized) return null;

  const response = await fetch(`${normalized}/${path}.json`, { method: 'GET' });
  if (!response.ok) return null;
  return response.json();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function buildReference(userId) {
  const seed = Math.random().toString(36).slice(2, 8);
  const cleanUserId = String(userId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
  return `vm_${cleanUserId}_${Date.now()}_${seed}`;
}

function looksPlaceholder(value) {
  if (!value) return true;
  const raw = String(value).trim();
  return raw.includes('xxxxxxxx') || raw.includes('example') || raw.endsWith('_test_xxxxxxxxxxxxxxxxx');
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function isPanelBlocked(ip) {
  const state = panelLoginAttempts.get(ip);
  if (!state) return false;
  if (!state.blockedUntil) return false;
  return state.blockedUntil > Date.now();
}

function registerPanelFailure(ip) {
  const now = Date.now();
  const state = panelLoginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  state.count += 1;

  if (state.count >= PANEL_MAX_ATTEMPTS) {
    state.blockedUntil = now + (Math.max(1, PANEL_LOCK_MINUTES) * 60 * 1000);
    state.count = 0;
  }

  panelLoginAttempts.set(ip, state);
}

function clearPanelFailures(ip) {
  panelLoginAttempts.delete(ip);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'premium-backend' });
});

app.post('/api/panel/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();
  const ip = getClientIp(req);

  if (isPanelBlocked(ip)) {
    return res.status(429).json({
      ok: false,
      authorized: false,
      message: `Demasiados intentos. Intenta de nuevo en ${PANEL_LOCK_MINUTES} minutos`
    });
  }

  if (!email || !password) {
    return res.status(400).json({ ok: false, authorized: false, message: 'Correo y clave son obligatorios' });
  }

  const hasPasswordConfigured = Boolean(PANEL_ACCESS_PASSWORD || PANEL_ACCESS_PASSWORD_HASH);
  if (!PANEL_ACCESS_EMAIL || !hasPasswordConfigured) {
    return res.status(500).json({
      ok: false,
      authorized: false,
      message: 'Configura PANEL_ACCESS_EMAIL y PANEL_ACCESS_PASSWORD (o PANEL_ACCESS_PASSWORD_HASH) en .env'
    });
  }

  const configuredHash = PANEL_ACCESS_PASSWORD_HASH || sha256(PANEL_ACCESS_PASSWORD);
  const receivedHash = sha256(password);
  const emailMatch = email === PANEL_ACCESS_EMAIL;
  const hashMatch =
    configuredHash.length === receivedHash.length &&
    crypto.timingSafeEqual(Buffer.from(configuredHash), Buffer.from(receivedHash));

  if (!emailMatch || !hashMatch) {
    registerPanelFailure(ip);
    return res.status(401).json({ ok: false, authorized: false, message: 'Correo o clave incorrectos' });
  }

  clearPanelFailures(ip);

  return res.json({ ok: true, authorized: true });
});

app.post('/api/premium/create-intent', (req, res) => {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const userId = req.body?.userId || 'anon';
  const amountInCents = 1990000; // $19.900 COP
  const currency = 'COP';
  const reference = buildReference(userId);
  const redirectUrl = process.env.APP_RETURN_URL || 'http://127.0.0.1:5500/index.html';

  if (!publicKey || !integritySecret || looksPlaceholder(publicKey) || looksPlaceholder(integritySecret)) {
    if (DEV_PREMIUM_MODE) {
      intentStore.set(reference, {
        userId,
        amountInCents,
        currency,
        createdAt: new Date().toISOString(),
        status: 'DEV_CREATED'
      });

      return res.json({
        ok: true,
        intent: {
          devMode: true,
          currency,
          amountInCents,
          reference,
          redirectUrl
        }
      });
    }

    return res.status(500).json({
      ok: false,
      message: 'Configura llaves reales de Wompi en .env (WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET)'
    });
  }

  const signature = sha256(`${reference}${amountInCents}${currency}${integritySecret}`);

  intentStore.set(reference, {
    userId,
    amountInCents,
    currency,
    createdAt: new Date().toISOString(),
    status: 'CREATED'
  });

  return res.json({
    ok: true,
    intent: {
      publicKey,
      currency,
      amountInCents,
      reference,
      signature,
      redirectUrl
    }
  });
});

app.post('/api/premium/dev-activate', async (req, res) => {
  if (!DEV_PREMIUM_MODE) {
    return res.status(403).json({ ok: false, message: 'Modo prueba no habilitado' });
  }

  if (!getNormalizedDbUrl()) {
    return res.status(500).json({ ok: false, message: 'Configura FIREBASE_DB_URL en .env para guardar premiumUsers' });
  }

  const userId = req.body?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, message: 'userId es obligatorio' });
  }

  try {
    const safeUser = encodeURIComponent(String(userId));
    const now = new Date();
    const durationDays = Number(process.env.PREMIUM_DURATION_DAYS || 30);
    const durationMs = Math.max(1, durationDays) * 24 * 60 * 60 * 1000;
    const premiumUntilDate = new Date(now.getTime() + durationMs);
    const updatedAt = now.toISOString();
    const premiumUntil = premiumUntilDate.toISOString();
    const transactionId = `dev_${Date.now()}`;

    await writeFirebase(`premiumUsers/${safeUser}/profile`, {
      active: true,
      source: 'dev-simulado',
      transactionId,
      status: 'APPROVED',
      amountInCents: 1990000,
      currency: 'COP',
      premiumUntil,
      updatedAt
    });

    await writeFirebase(`premiumUsers/${safeUser}/transactions/${encodeURIComponent(transactionId)}`, {
      transactionId,
      status: 'APPROVED',
      source: 'dev-simulado',
      amountInCents: 1990000,
      currency: 'COP',
      paidAt: updatedAt,
      createdAt: updatedAt,
      premiumUntil
    });

    return res.json({ ok: true, approved: true, status: 'APPROVED', premiumUntil, devMode: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error activando premium de prueba', detail: error.message });
  }
});

app.post('/api/premium/confirm', async (req, res) => {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey || looksPlaceholder(privateKey)) {
    return res.status(500).json({ ok: false, message: 'Configura WOMPI_PRIVATE_KEY real en .env' });
  }

  if (!getNormalizedDbUrl()) {
    return res.status(500).json({ ok: false, message: 'Configura FIREBASE_DB_URL en .env para guardar premiumUsers' });
  }

  const transactionId = req.body?.transactionId;
  const userId = req.body?.userId;

  if (!transactionId || !userId) {
    return res.status(400).json({ ok: false, message: 'transactionId y userId son obligatorios' });
  }

  try {
    const response = await fetch(`https://api.wompi.co/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${privateKey}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ ok: false, message: 'Error consultando Wompi', detail: text });
    }

    const payload = await response.json();
    const status = payload?.data?.status || 'UNKNOWN';

    if (status !== 'APPROVED') {
      return res.status(409).json({ ok: false, approved: false, status });
    }

    const safeUser = encodeURIComponent(String(userId));
    const now = new Date();
    const durationDays = Number(process.env.PREMIUM_DURATION_DAYS || 30);
    const durationMs = Math.max(1, durationDays) * 24 * 60 * 60 * 1000;
    const premiumUntilDate = new Date(now.getTime() + durationMs);
    const updatedAt = now.toISOString();
    const premiumUntil = premiumUntilDate.toISOString();

    const wompiData = payload?.data || {};
    const profilePayload = {
      active: true,
      source: 'wompi',
      transactionId,
      status: 'APPROVED',
      amountInCents: wompiData.amount_in_cents || null,
      currency: wompiData.currency || 'COP',
      premiumUntil,
      updatedAt
    };

    await writeFirebase(`premiumUsers/${safeUser}/profile`, profilePayload);
    await writeFirebase(`premiumUsers/${safeUser}/transactions/${encodeURIComponent(transactionId)}`, {
      transactionId,
      status: 'APPROVED',
      source: 'wompi',
      amountInCents: wompiData.amount_in_cents || null,
      currency: wompiData.currency || 'COP',
      paidAt: wompiData.finalized_at || updatedAt,
      createdAt: updatedAt,
      premiumUntil
    });

    return res.json({ ok: true, approved: true, status: 'APPROVED', premiumUntil });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error interno confirmando pago', detail: error.message });
  }
});

app.get('/api/premium/status/:userId', async (req, res) => {
  const userId = req.params?.userId;
  if (!userId) {
    return res.status(400).json({ ok: false, message: 'userId es obligatorio' });
  }

  try {
    const safeUser = encodeURIComponent(String(userId));
    const profile = await readFirebase(`premiumUsers/${safeUser}/profile`);

    if (!profile) {
      return res.json({ ok: true, active: false, premiumUntil: null });
    }

    const premiumUntil = profile.premiumUntil || null;
    const active = Boolean(profile.active) && premiumUntil && (new Date(premiumUntil).getTime() > Date.now());

    return res.json({
      ok: true,
      active,
      premiumUntil,
      source: profile.source || null,
      transactionId: profile.transactionId || null,
      updatedAt: profile.updatedAt || null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'No se pudo consultar estado premium', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Premium backend activo en http://localhost:${PORT}`);
});
