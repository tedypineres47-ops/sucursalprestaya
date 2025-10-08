// /api/login.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo POST permitido' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    // ⚠️ Ejemplo: esto debería venir de process.env en producción
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = '1234';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.status(200).json({ message: 'Login correcto ✅' });
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error('Error en handler', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
