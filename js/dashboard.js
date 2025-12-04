/**
 * dashboard.js - Manejo simplificado de dashboard
 */

const BASE_PATH = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
const AUTH_URL = window.location.origin + BASE_PATH + '/php/auth.php';

let currentUser = null;
let userData = null;

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
});

async function checkSession() {
    try {
        const response = await fetch(`${AUTH_URL}?action=check`);
        
        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }
        
        const result = await response.json();
        currentUser = result.usuario;
        userData = result.datos_adicionales;
        
        console.log('✅ Usuario:', currentUser.rol, currentUser.nombre);
        
        // Actualizar UI
        document.getElementById('user-name').textContent = currentUser.nombre;
        const rolBadge = document.getElementById('user-rol');
        rolBadge.textContent = currentUser.rol;
        rolBadge.className = `user-rol ${currentUser.rol}`;
        
        // Mostrar vista según rol
        await mostrarVistaPorRol();
        
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'login.html';
    }
}

async function mostrarVistaPorRol() {
    // Ocultar todo
    document.getElementById('admin-tabs').classList.add('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('vista-aprendiz').classList.add('hidden');
    document.getElementById('vista-mentor').classList.add('hidden');
    
    switch(currentUser.rol) {
        case 'admin':
            await mostrarVistaAdmin();
            break;
        case 'mentor':
            await mostrarVistaMentor();
            break;
        case 'aprendiz':
            await mostrarVistaAprendiz();
            break;
    }
}

// ==================== VISTA ADMIN ====================

async function mostrarVistaAdmin() {
    document.getElementById('admin-tabs').classList.remove('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
    
    // Configurar tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
    
    // Inicializar app.js si existe
    if (typeof initializeApp === 'function') {
        await initializeApp();
    }
    
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }
    
    if (typeof loadDashboard === 'function') {
        await loadDashboard();
    }
}

// ==================== VISTA MENTOR ====================

async function mostrarVistaMentor() {
    document.getElementById('vista-mentor').classList.remove('hidden');
    
    if (!userData) {
        // Mostrar formulario de completar perfil
        document.getElementById('mentor-perfil-incompleto').classList.remove('hidden');
        document.getElementById('mentor-panel-principal').classList.add('hidden');
        
        document.getElementById('form-completar-perfil-mentor').addEventListener('submit', async (e) => {
            e.preventDefault();
            await completarPerfilMentor(e);
        });
    } else {
        // Mostrar panel principal
        document.getElementById('mentor-perfil-incompleto').classList.add('hidden');
        document.getElementById('mentor-panel-principal').classList.remove('hidden');
        
        await cargarDatosMentor();
    }
}

async function completarPerfilMentor(e) {
    const formData = new FormData(e.target);
    const data = {
        carrera: formData.get('carrera'),
        semestre: parseInt(formData.get('semestre')),
        materias: formData.get('materias').split(',').map(m => m.trim()),
        habilidades: formData.get('habilidades').split(',').map(h => h.trim()),
        disponibilidad: formData.get('disponibilidad')
    };
    
    try {
        const response = await fetch(`${AUTH_URL}?action=completar-perfil-mentor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('✅ Perfil completado exitosamente');
            location.reload();
        } else {
            const result = await response.json();
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al completar perfil');
    }
}

async function cargarDatosMentor() {
    try {
        const response = await fetch(`${AUTH_URL}?action=get-mentor-data`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error:', data.error);
            return;
        }
        
        // Actualizar estadísticas
        document.getElementById('mentor-total-aprendices').textContent = data.aprendices.length;
        document.getElementById('mentor-sesiones-pendientes').textContent = 
            data.sesiones.filter(s => s.estado === 'programada').length;
        document.getElementById('mentor-sesiones-completadas').textContent = 
            data.sesiones.filter(s => s.estado === 'completada').length;
        
        // Cargar secciones
        cargarSolicitudesPendientes(data.sesiones);
        cargarSesionesProgramadas(data.sesiones);
        cargarAprendicesMentor(data.aprendices);
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

function cargarSolicitudesPendientes(sesiones) {
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    
    const pendientes = sesiones.filter(s => {
        const fechaCreacion = new Date(s.fecha_creacion);
        return s.estado === 'programada' && fechaCreacion > hace24h;
    });
    
    const container = document.getElementById('mentor-solicitudes-pendientes');
    
    if (pendientes.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay solicitudes nuevas</p>';
        return;
    }
    
    container.innerHTML = pendientes.map(s => `
        <div class="sesion-item programada">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${s.tema}</p>
                    <p class="sesion-participantes">Solicitado por: ${s.aprendiz_nombre}</p>
                </div>
                <span class="estado-badge pendiente">Nueva</span>
            </div>
            <p class="sesion-fecha">📅 ${s.fecha} a las ${s.hora} - ${s.modalidad}</p>
            <div class="sesion-actions">
                <button class="btn-confirm" onclick="confirmarSesion(${s.id})">✓ Confirmar</button>
                <button class="btn-reject" onclick="rechazarSesion(${s.id})">✗ Rechazar</button>
            </div>
        </div>
    `).join('');
}

function cargarSesionesProgramadas(sesiones) {
    const programadas = sesiones.filter(s => s.estado === 'programada');
    const container = document.getElementById('mentor-sesiones-programadas');
    
    if (programadas.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay sesiones programadas</p>';
        return;
    }
    
    container.innerHTML = programadas.map(s => `
        <div class="sesion-item programada">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${s.tema}</p>
                    <p class="sesion-participantes">Con: ${s.aprendiz_nombre}</p>
                </div>
                <span class="sesion-badge programada">programada</span>
            </div>
            <p class="sesion-fecha">📅 ${s.fecha} a las ${s.hora} - ${s.modalidad}</p>
            <button class="btn btn-success btn-sm" onclick="completarSesionMentor(${s.id})">
                ✓ Marcar como Completada
            </button>
        </div>
    `).join('');
}

function cargarAprendicesMentor(aprendices) {
    const container = document.getElementById('mentor-lista-aprendices');
    
    if (aprendices.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No tienes aprendices asignados</p>';
        return;
    }
    
    container.innerHTML = aprendices.map(a => `
        <div class="list-item">
            <div>
                <p style="font-weight: 600;">${a.nombre}</p>
                <p style="font-size: 0.875rem; color: #6b7280;">
                    ${a.carrera} - Semestre ${a.semestre}
                </p>
            </div>
        </div>
    `).join('');
}

async function confirmarSesion(sesionId) {
    if (!confirm('¿Confirmar esta sesión?')) return;
    
    try {
        const response = await fetch(`${AUTH_URL}?action=confirmar-sesion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesionId })
        });
        
        if (response.ok) {
            alert('✅ Sesión confirmada');
            await cargarDatosMentor();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al confirmar sesión');
    }
}

async function rechazarSesion(sesionId) {
    const motivo = prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return;
    
    try {
        const response = await fetch(`${AUTH_URL}?action=rechazar-sesion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesionId, motivo })
        });
        
        if (response.ok) {
            alert('❌ Sesión rechazada');
            await cargarDatosMentor();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al rechazar sesión');
    }
}

async function completarSesionMentor(sesionId) {
    const bitacora = prompt('Ingrese las notas de la sesión:');
    if (!bitacora || bitacora.trim() === '') return;
    
    try {
        const response = await fetch(`${AUTH_URL}?action=completar-sesion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesionId, bitacora: bitacora.trim() })
        });
        
        if (response.ok) {
            alert('✅ Sesión completada');
            await cargarDatosMentor();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al completar sesión');
    }
}

// ==================== VISTA APRENDIZ ====================

async function mostrarVistaAprendiz() {
    document.getElementById('vista-aprendiz').classList.remove('hidden');
    
    if (!userData) {
        document.getElementById('aprendiz-perfil-incompleto').classList.remove('hidden');
        document.getElementById('aprendiz-panel-principal').classList.add('hidden');
        
        document.getElementById('form-completar-perfil-aprendiz').addEventListener('submit', async (e) => {
            e.preventDefault();
            await completarPerfilAprendiz(e);
        });
    } else {
        document.getElementById('aprendiz-perfil-incompleto').classList.add('hidden');
        document.getElementById('aprendiz-panel-principal').classList.remove('hidden');
        
        await cargarDatosAprendiz();
    }
}

async function completarPerfilAprendiz(e) {
    const formData = new FormData(e.target);
    const data = {
        carrera: formData.get('carrera'),
        semestre: parseInt(formData.get('semestre')),
        materias: formData.get('materias').split(',').map(m => m.trim()),
        habilidades: formData.get('habilidades').split(',').map(h => h.trim()),
        disponibilidad: formData.get('disponibilidad')
    };
    
    try {
        const response = await fetch(`${AUTH_URL}?action=completar-perfil-aprendiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('✅ Perfil completado exitosamente');
            location.reload();
        } else {
            const result = await response.json();
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al completar perfil');
    }
}

async function cargarDatosAprendiz() {
    try {
        const response = await fetch(`${AUTH_URL}?action=get-aprendiz-data`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error:', data.error);
            return;
        }
        
        const mentorInfo = document.getElementById('aprendiz-mentor-info');
        const formSolicitar = document.getElementById('form-solicitar-sesion');
        
        if (data.mentor) {
            mentorInfo.innerHTML = `
                <div class="mentor-activo-card">
                    <div>
                        <h4>Tu Mentor: ${data.mentor.nombre}</h4>
                        <p>${data.mentor.carrera} - Semestre ${data.mentor.semestre}</p>
                        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                            📅 ${data.mentor.disponibilidad}
                        </p>
                    </div>
                </div>
            `;
            
            formSolicitar.classList.remove('hidden');
            formSolicitar.onsubmit = async (e) => {
                e.preventDefault();
                await solicitarSesion(e, data.emparejamiento.id);
            };
        } else {
            mentorInfo.innerHTML = `
                <div class="alert warning">
                    <p>⏳ Aún no tienes un mentor asignado</p>
                </div>
            `;
            formSolicitar.classList.add('hidden');
        }
        
        // Cargar sesiones
        cargarSesionesAprendiz(data.sesiones, data.mentor);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function solicitarSesion(e, emparejamientoId) {
    const formData = new FormData(e.target);
    
    await DB.init();
    await DB.addSesion({
        emparejamientoId: emparejamientoId,
        fecha: formData.get('fecha'),
        hora: formData.get('hora'),
        tema: formData.get('tema'),
        modalidad: formData.get('modalidad'),
        estado: 'programada'
    });
    
    alert('✅ Sesión solicitada exitosamente');
    e.target.reset();
    await cargarDatosAprendiz();
}

function cargarSesionesAprendiz(sesiones, mentor) {
    const container = document.getElementById('aprendiz-sesiones');
    
    if (!sesiones || sesiones.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No tienes sesiones programadas</p>';
        return;
    }
    
    container.innerHTML = sesiones.map(s => `
        <div class="sesion-item ${s.estado}">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${s.tema}</p>
                    <p class="sesion-participantes">Con: ${mentor.nombre}</p>
                </div>
                <span class="sesion-badge ${s.estado}">${s.estado}</span>
            </div>
            <p class="sesion-fecha">📅 ${s.fecha} a las ${s.hora} - ${s.modalidad}</p>
            ${s.bitacora ? `
                <p class="sesion-bitacora">
                    <strong>Notas:</strong> ${s.bitacora}
                </p>
            ` : ''}
        </div>
    `).join('');
}

// ==================== LOGOUT ====================

async function logout() {
    try {
        await fetch(`${AUTH_URL}?action=logout`, { method: 'POST' });
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'index.html';
    }
}

// Exponer funciones globalmente
window.logout = logout;
window.confirmarSesion = confirmarSesion;
window.rechazarSesion = rechazarSesion;
window.completarSesionMentor = completarSesionMentor;