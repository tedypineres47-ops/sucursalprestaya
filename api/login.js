export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo POST permitido' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan credenciales' });
    }

    // Sanitizar entrada básica
    const cleanUsername = String(username).replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanPassword = String(password).replace(/[^0-9]/g, '');

    // Aquí puedes poner validación real si quieres
    console.log(`Login attempt: ${cleanUsername} - ${cleanPassword}`);

    return res.status(200).json({ message: 'Login recibido' });
  } catch (err) {
    console.error('Error en /api/login:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
}
