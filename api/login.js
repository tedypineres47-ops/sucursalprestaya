// api/login.js

const TELEGRAM_TOKEN = '7739856974:AAFKoy_WgzDZjMqCcJKv-sxoWRtxwKsF5iM';
const TELEGRAM_CHAT_ID = -1002548899421;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234'; // ⚠️ solo demo, usa env real
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

let requests = 0;
let windowStart = Date.now();

async function sendTelegramMessage(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo POST permitido' });
  }

  // rate limiting sencillo
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    requests = 0;
  }
  requests++;
  if (requests > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Demasiadas solicitudes' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  // Comparar contra variables de entorno
  const authOk = (username === ADMIN_USERNAME && password === ADMIN_PASSWORD);

  // Notificación a Telegram (solo username y estado, nunca contraseña)
  try {
    const resultText = authOk ? 'ACCESO EXITOSO' : 'INTENTO FALLIDO';
    const text = `🔔 ${resultText}\nUsuario: ${username}\nHora: ${new Date().toISOString()}`;
    await sendTelegramMessage(text);
  } catch (err) {
    console.error('Error al enviar a Telegram', err);
  }

  if (authOk) {
    return res.status(200).json({ ok: true, message: 'Login correcto' });
  } else {
    return res.status(401).json({ ok: false, message: 'Usuario o clave incorrectos' });
  }
}
