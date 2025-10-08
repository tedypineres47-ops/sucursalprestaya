// api/login.js
import bcrypt from 'bcryptjs';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BCRYPT_PASSWORD_HASH = process.env.BCRYPT_PASSWORD_HASH; // hash de la contraseña esperada (admin/test) - ver más abajo
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'; // opcional
const RATE_LIMIT_MAX = 10; // máximo de requests por instancia
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // ventana en ms

// simple rate limiter por instancia (memoria ephemeral - válido como control básico)
let requests = 0;
let windowStart = Date.now();

async function sendTelegramMessage(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text
  };
  // Node 18+ en Vercel tiene fetch global
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  // rate limiting sencillo
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    // reset
    windowStart = now;
    requests = 0;
  }
  requests++;
  if (requests > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many requests' });
  }

  // Basic origin check (mejora: validar contra lista de orígenes permitidos)
  const origin = req.headers.origin || req.headers.referer || '';
  // if (origin && !origin.startsWith('https://tu-dominio.com')) { return res.status(403).json({message:'Forbidden origin'}); }

  const { username, password } = req.body || {};

  // Validación y sanitización básica
  if (!username || typeof username !== 'string' || username.trim().length === 0 || username.length > 50) {
    return res.status(400).json({ message: 'Usuario inválido' });
  }
  if (!password || typeof password !== 'string' || password.length === 0 || password.length > 128) {
    return res.status(400).json({ message: 'Contraseña inválida' });
  }

  // Aquí comparamos la contraseña con el hash guardado en la variable de entorno.
  // Si no hay hash configurado, rechazamos por seguridad.
  if (!BCRYPT_PASSWORD_HASH) {
    console.error('BCRYPT_PASSWORD_HASH no configurado en env');
    return res.status(500).json({ message: 'Configuración del servidor incompleta' });
  }

  let authOk = false;
  try {
    authOk = await bcrypt.compare(password, BCRYPT_PASSWORD_HASH);
  } catch (err) {
    console.error('bcrypt error', err);
    return res.status(500).json({ message: 'Error interno' });
  }

  // Notificar a Telegram: sólo nombre de usuario + resultado. NUNCA incluir la contraseña.
  try {
    const shortUser = username.replace(/[^a-zA-Z0-9._-]/g, '');
    const resultText = authOk ? 'ACCESO EXITOSO' : 'INTENTO FALLIDO';
    const text = `🔔 ${resultText}\nUsuario: ${shortUser}\nHora: ${new Date().toISOString()}`;
    await sendTelegramMessage(text);
  } catch (err) {
    console.error('Telegram error', err);
    // no bloqueamos el flujo por fallo en notificación
  }

  if (authOk) {
    // Aquí podrías devolver un token JWT o sesión, según tu diseño; ejemplo mínimo:
    return res.status(200).json({ ok: true, message: 'Autenticación correcta' });
  } else {
    return res.status(401).json({ ok: false, message: 'Usuario o clave incorrectos' });
  }
}
