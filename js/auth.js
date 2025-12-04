/**
 * auth.js - Manejo de autenticación y roles
 */

const BASE_PATH = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
const AUTH_URL = window.location.origin + BASE_PATH + '/php/auth.php';

let currentUser = null;
let aprendizData = null;
let mentorData = null;

// Verificar sesión al cargar
async function checkSession() {
    try {
        const response = await fetch(`${AUTH_URL}?action=check`);
        
        if (response.ok) {
            const result = await response.json();
            currentUser = result.usuario;
            
            console.log('✅ Usuario autenticado:', currentUser);
            
            // Actualizar UI con info de usuario
            document.getElementById('user-name').textContent = currentUser.nombre;
            const rolBadge = document.getElementById('user-rol');
            rolBadge.textContent = currentUser.rol;
            rolBadge.className = `user-rol ${currentUser.rol}`;
            
            // Configurar vista según el rol
            await setupViewByRole(currentUser.rol, result.datos_adicionales);
        } else {
            // No hay sesión, redirigir a login
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        window.location.href = 'login.html';
    }
}

async function setupViewByRole(rol, datosAdicionales) {
    // Ocultar todas las vistas
    document.getElementById('admin-tabs').classList.add('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('vista-aprendiz').classList.add('hidden');
    document.getElementById('vista-mentor').classList.add('hidden');
    
    switch(rol) {
        case 'admin':
            await setupAdminView();
            break;
        case 'mentor':
            await setupMentorView(datosAdicionales);
            break;
        case 'aprendiz':
            await setupAprendizView(datosAdicionales);
            break;
    }
}

async function setupAdminView() {
    console.log('🔧 Configurando vista de administrador');
    
    document.getElementById('admin-tabs').classList.remove('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
    
    // Esperar a que DB se inicialice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Inicializar app.js
    if (typeof initializeApp === 'function') {
        await initializeApp();
    }
    
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }
    
    if (typeof loadDashboard === 'function') {
        await loadDashboard();
    }
    
    console.log('✅ Vista de administrador configurada');
}

async function setupAprendizView(datosAdicionales) {
    console.log('🎓 Configurando vista de aprendiz');
    
    document.getElementById('vista-aprendiz').classList.remove('hidden');
    
    aprendizData = datosAdicionales;
    
    if (!datosAdicionales) {
        // Mostrar formulario de completar perfil
        document.getElementById('aprendiz-perfil-incompleto').classList.remove('hidden');
        document.getElementById('aprendiz-panel-principal').classList.add('hidden');
        
        const formPerfil = document.getElementById('form-completar-perfil-aprendiz');
        formPerfil.removeEventListener('submit', handleCompletarPerfilAprendiz);
        formPerfil.addEventListener('submit', handleCompletarPerfilAprendiz);
    } else {
        // Mostrar panel principal
        document.getElementById('aprendiz-perfil-incompleto').classList.add('hidden');
        document.getElementById('aprendiz-panel-principal').classList.remove('hidden');
        
        await loadAprendizPanel();
    }
    
    console.log('✅ Vista de aprendiz configurada');
}

async function handleCompletarPerfilAprendiz(e) {
    e.preventDefault();
    
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
        
        const result = await response.json();
        
        if (response.ok) {
            alert('✅ Perfil completado exitosamente');
            location.reload();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al completar perfil');
    }
}

async function loadAprendizPanel() {
    // Inicializar DB
    await DB.init();
    
    // Verificar si tiene mentor asignado
    const emparejamientos = await DB.getEmparejamientos();
    const miEmparejamiento = emparejamientos.find(e => e.aprendiz_id === aprendizData.id);
    
    const mentorInfo = document.getElementById('aprendiz-mentor-info');
    const formSolicitar = document.getElementById('form-solicitar-sesion');
    
    if (miEmparejamiento) {
        const mentor = await DB.getMentorById(miEmparejamiento.mentor_id);
        mentorInfo.innerHTML = `
            <div class="mentor-activo-card">
                <div>
                    <h4>Tu Mentor: ${mentor.nombre}</h4>
                    <p>${mentor.carrera} - Semestre ${mentor.semestre}</p>
                    <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                        📅 ${mentor.disponibilidad}
                    </p>
                </div>
            </div>
        `;
        
        formSolicitar.classList.remove('hidden');
        formSolicitar.removeEventListener('submit', handleSolicitarSesionWrapper);
        formSolicitar.addEventListener('submit', (e) => handleSolicitarSesion(e, miEmparejamiento.id));
    } else {
        mentorInfo.innerHTML = `
            <div class="alert warning">
                <p>⏳ Aún no tienes un mentor asignado. Un administrador te asignará uno pronto.</p>
            </div>
        `;
        formSolicitar.classList.add('hidden');
    }
    
    // Cargar sesiones del aprendiz
    await loadAprendizSesiones();
}

function handleSolicitarSesionWrapper(e) {
    // Placeholder para remover listener
}

async function handleSolicitarSesion(e, emparejamientoId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const sesionData = {
        emparejamientoId: emparejamientoId,
        fecha: formData.get('fecha'),
        hora: formData.get('hora'),
        tema: formData.get('tema'),
        modalidad: formData.get('modalidad'),
        estado: 'programada'
    };
    
    await DB.addSesion(sesionData);
    alert('✅ Sesión solicitada exitosamente. Tu mentor la revisará pronto.');
    e.target.reset();
    await loadAprendizSesiones();
}

async function loadAprendizSesiones() {
    const emparejamientos = await DB.getEmparejamientos();
    const miEmparejamiento = emparejamientos.find(e => e.aprendiz_id === aprendizData.id);
    
    if (!miEmparejamiento) return;
    
    const sesiones = await DB.getSesionesByEmparejamiento(miEmparejamiento.id);
    const mentor = await DB.getMentorById(miEmparejamiento.mentor_id);
    
    const container = document.getElementById('aprendiz-sesiones');
    
    if (sesiones.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No tienes sesiones programadas</p>';
        return;
    }
    
    container.innerHTML = sesiones.map(sesion => `
        <div class="sesion-item ${sesion.estado}">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${sesion.tema}</p>
                    <p class="sesion-participantes">Con: ${mentor.nombre}</p>
                </div>
                <span class="sesion-badge ${sesion.estado}">${sesion.estado}</span>
            </div>
            <p class="sesion-fecha">
                ${sesion.fecha} a las ${sesion.hora} - ${sesion.modalidad}
            </p>
            ${sesion.bitacora ? `
                <p class="sesion-bitacora">
                    <strong>Notas del mentor:</strong> ${sesion.bitacora}
                </p>
            ` : ''}
        </div>
    `).join('');
}

async function setupMentorView(datosAdicionales) {
    console.log('👨‍🏫 Configurando vista de mentor');
    
    document.getElementById('vista-mentor').classList.remove('hidden');
    
    mentorData = datosAdicionales;
    
    if (!datosAdicionales) {
        // Mostrar formulario de completar perfil
        document.getElementById('mentor-perfil-incompleto').classList.remove('hidden');
        document.getElementById('mentor-panel-principal').classList.add('hidden');
        
        const formPerfil = document.getElementById('form-completar-perfil-mentor');
        formPerfil.removeEventListener('submit', handleCompletarPerfilMentor);
        formPerfil.addEventListener('submit', handleCompletarPerfilMentor);
    } else {
        // Mostrar panel principal
        document.getElementById('mentor-perfil-incompleto').classList.add('hidden');
        document.getElementById('mentor-panel-principal').classList.remove('hidden');
        
        await loadMentorPanel();
    }
    
    console.log('✅ Vista de mentor configurada');
}

async function handleCompletarPerfilMentor(e) {
    e.preventDefault();
    
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
        
        const result = await response.json();
        
        if (response.ok) {
            alert('✅ Perfil completado exitosamente');
            location.reload();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al completar perfil');
    }
}

async function loadMentorPanel() {
    // Inicializar DB
    await DB.init();
    
    const emparejamientos = await DB.getEmparejamientos();
    const misEmparejamientos = emparejamientos.filter(e => e.mentor_id === mentorData.id);
    
    const sesiones = await DB.getSesiones();
    const misSesiones = sesiones.filter(s => 
        misEmparejamientos.some(e => e.id === parseInt(s.emparejamiento_id))
    );
    
    const sesionesCompletadas = misSesiones.filter(s => s.estado === 'completada').length;
    const sesionesPendientes = misSesiones.filter(s => s.estado === 'programada').length;
    
    // Actualizar estadísticas
    document.getElementById('mentor-total-aprendices').textContent = misEmparejamientos.length;
    document.getElementById('mentor-sesiones-pendientes').textContent = sesionesPendientes;
    document.getElementById('mentor-sesiones-completadas').textContent = sesionesCompletadas;
    
    // Cargar sesiones programadas
    await loadMentorSesionesProgramadas(misSesiones, misEmparejamientos);
    
    // Cargar lista de aprendices
    await loadMentorAprendices(misEmparejamientos);
}

async function loadMentorSesionesProgramadas(sesiones, emparejamientos) {
    const sesionesProgramadas = sesiones.filter(s => s.estado === 'programada');
    const container = document.getElementById('mentor-sesiones-programadas');
    
    if (sesionesProgramadas.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No tienes sesiones pendientes</p>';
        return;
    }
    
    const aprendices = await DB.getAprendices();
    
    container.innerHTML = sesionesProgramadas.map(sesion => {
        const emp = emparejamientos.find(e => e.id === parseInt(sesion.emparejamiento_id));
        const aprendiz = aprendices.find(a => a.id === emp?.aprendiz_id);
        
        return `
            <div class="sesion-item programada">
                <div class="sesion-header">
                    <div>
                        <p class="sesion-tema">${sesion.tema}</p>
                        <p class="sesion-participantes">Con: ${aprendiz?.nombre || 'N/A'}</p>
                    </div>
                    <span class="sesion-badge programada">programada</span>
                </div>
                <p class="sesion-fecha">
                    ${sesion.fecha} a las ${sesion.hora} - ${sesion.modalidad}
                </p>
                <button class="btn btn-success btn-sm" onclick="mentorCompletarSesion(${sesion.id})">
                    Marcar como Completada
                </button>
            </div>
        `;
    }).join('');
}

async function loadMentorAprendices(emparejamientos) {
    const aprendices = await DB.getAprendices();
    const container = document.getElementById('mentor-lista-aprendices');
    
    if (emparejamientos.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No tienes aprendices asignados aún</p>';
        return;
    }
    
    container.innerHTML = emparejamientos.map(emp => {
        const aprendiz = aprendices.find(a => a.id === emp.aprendiz_id);
        
        return `
            <div class="list-item">
                <div>
                    <p style="font-weight: 600;">${aprendiz?.nombre || 'N/A'}</p>
                    <p style="font-size: 0.875rem; color: #6b7280;">
                        ${aprendiz?.carrera || 'N/A'} - Semestre ${aprendiz?.semestre || 'N/A'}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

async function mentorCompletarSesion(sesionId) {
    const bitacora = prompt('Ingrese las notas de la sesión:');
    
    if (bitacora !== null && bitacora.trim() !== '') {
        await DB.updateSesion(sesionId, {
            estado: 'completada',
            bitacora: bitacora.trim(),
            fechaCompletada: new Date().toISOString()
        });
        
        alert('✅ Sesión marcada como completada');
        await loadMentorPanel();
    }
}

async function logout() {
    try {
        await fetch(`${AUTH_URL}?action=logout`, { method: 'POST' });
        window.location.href = 'index.html'; // Ir a la página pública
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'index.html';
    }
}

// Exponer funciones globalmente
window.logout = logout;
window.mentorCompletarSesion = mentorCompletarSesion;
window.checkSession = checkSession;