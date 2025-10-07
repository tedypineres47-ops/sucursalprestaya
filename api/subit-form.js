// Configuración
const API_URL = '/api/submit-form';

// Elementos del formulario
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');

// Validación en tiempo real
function validateForm() {
  const usernameValid = usernameInput.value.length > 0;
  const passwordValid = passwordInput.value.length === 4 && /^\d+$/.test(passwordInput.value);
  
  loginBtn.disabled = !(usernameValid && passwordValid);
  return usernameValid && passwordValid;
}

// Event listeners para validación
usernameInput.addEventListener('input', validateForm);
passwordInput.addEventListener('input', validateForm);

// Manejar envío del formulario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  // Deshabilitar botón durante el envío
  loginBtn.disabled = true;
  loginBtn.textContent = 'Enviando...';

  try {
    const formData = {
      username: usernameInput.value,
      password: passwordInput.value
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      // Éxito - mostrar mensaje y resetear formulario
      alert('Datos enviados correctamente');
      loginForm.reset();
    } else {
      // Error
      alert(result.error || 'Error al enviar los datos');
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  } finally {
    // Restaurar botón
    loginBtn.disabled = false;
    loginBtn.textContent = 'Iniciar sesión';
    validateForm();
  }
});

// Validación inicial
validateForm();