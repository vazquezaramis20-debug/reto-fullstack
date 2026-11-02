const API_URL = 'http://localhost:4000/api';
let modoRegistro = false;

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authForm = document.getElementById('auth-form');
const itemForm = document.getElementById('item-form');
const itemsList = document.getElementById('items-list');
const alertBox = document.getElementById('alert-box');
const userInfo = document.getElementById('user-info');
const welcomeMsg = document.getElementById('welcome-msg');
const toggleAuthLink = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const btnSubmitAuth = document.getElementById('btn-submit-auth');

function mostrarAlerta(mensaje, tipo = 'error') {
  alertBox.textContent = mensaje;
  alertBox.className = `alert ${tipo}`;
  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

toggleAuthLink.addEventListener('click', (e) => {
  e.preventDefault();
  modoRegistro = !modoRegistro;
  authTitle.textContent = modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión';
  btnSubmitAuth.textContent = modoRegistro ? 'Registrarse' : 'Entrar';
  toggleAuthLink.textContent = modoRegistro ? 'Inicia sesión aquí' : 'Regístrate aquí';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const endpoint = modoRegistro ? '/auth/register' : '/auth/login';

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error || (data.errores ? data.errores[0].msg : 'Error en la solicitud');
      throw new Error(errorMsg);
    }

    if (modoRegistro) {
      mostrarAlerta('Registro exitoso. Ahora inicia sesión.', 'success');
      toggleAuthLink.click();
      authForm.reset();
    } else {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      verificarEstadoSesion();
    }
  } catch (err) {
    mostrarAlerta(err.message, 'error');
  }
});

async function cargarItems() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const items = await res.json();
    itemsList.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-box';
      card.innerHTML = `
        <div>
          <div class="item-header">${item.nombre}</div>
          <span class="badge">${item.categoria}</span>
          <p>Precio: <strong>$${item.precio.toFixed(2)}</strong></p>
          <p>Stock: ${item.stock} unidades</p>
        </div>
        <div style="margin-top: 10px; text-align: right;">
          <button class="btn-danger" onclick="eliminarItem('${item._id}')">Eliminar</button>
        </div>
      `;
      itemsList.appendChild(card);
    });
  } catch (err) {
    mostrarAlerta('Error al conectar con el servidor backend', 'error');
  }
}

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const nuevoItem = {
    nombre: document.getElementById('nombre').value,
    categoria: document.getElementById('categoria').value,
    precio: parseFloat(document.getElementById('precio').value),
    stock: parseInt(document.getElementById('stock').value, 10)
  };

  try {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(nuevoItem)
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al guardar el elemento');
    }

    itemForm.reset();
    mostrarAlerta('Elemento agregado correctamente', 'success');
    cargarItems();
  } catch (err) {
    mostrarAlerta(err.message, 'error');
  }
});

window.eliminarItem = async (id) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');

    mostrarAlerta('Elemento eliminado', 'success');
    cargarItems();
  } catch (err) {
    mostrarAlerta(err.message, 'error');
  }
};

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  verificarEstadoSesion();
});

function verificarEstadoSesion() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  if (token) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    welcomeMsg.textContent = `Usuario: ${username}`;
    cargarItems();
  } else {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    userInfo.classList.add('hidden');
  }
}

verificarEstadoSesion();