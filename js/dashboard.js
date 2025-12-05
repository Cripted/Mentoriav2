/**
 * dashboard.js - Con debugging completo y gestión de estados mejorada
 * VERSIÓN CORREGIDA: Las sesiones confirmadas ahora se muestran correctamente
 */

var DASHBOARD_BASE_PATH = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
var DASHBOARD_AUTH_URL = window.location.origin + DASHBOARD_BASE_PATH + '/php/auth.php';

let dashboardCurrentUser = null;
let dashboardUserData = null;

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando dashboard...');
    
    // Inicializar DB primero
    if (typeof DB !== 'undefined') {
        await DB.init();
        console.log('✅ API inicializada');
    } else {
        console.error('❌ DB no disponible');
    }
    
    await checkDashboardSession();
});

async function checkDashboardSession() {
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=check`);
        
        if (!response.ok) {
            console.log('❌ No hay sesión activa');
            window.location.href = 'login.html';
            return;
        }
        
        const result = await response.json();
        dashboardCurrentUser = result.usuario;
        dashboardUserData = result.datos_adicionales;
        
        console.log('✅ Usuario:', dashboardCurrentUser);
        console.log('📊 Datos adicionales:', dashboardUserData);
        
        // Actualizar UI
        document.getElementById('user-name').textContent = dashboardCurrentUser.nombre;
        const rolBadge = document.getElementById('user-rol');
        rolBadge.textContent = dashboardCurrentUser.rol;
        rolBadge.className = `user-rol ${dashboardCurrentUser.rol}`;
        
        // Mostrar vista según rol
        await mostrarVistaPorRol();
        
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        window.location.href = 'login.html';
    }
}

async function mostrarVistaPorRol() {
    // Ocultar todo
    document.getElementById('admin-tabs').classList.add('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    document.getElementById('vista-aprendiz').classList.add('hidden');
    document.getElementById('vista-mentor').classList.add('hidden');
    
    console.log('👤 Mostrando vista para:', dashboardCurrentUser.rol);
    
    switch(dashboardCurrentUser.rol) {
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
    console.log('👨‍💼 Cargando vista admin...');
    
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
    
    console.log('✅ Vista admin cargada');
}

// ==================== VISTA MENTOR ====================

async function mostrarVistaMentor() {
    console.log('👨‍🏫 Cargando vista mentor...');
    console.log('📊 Datos del mentor:', dashboardUserData);
    
    document.getElementById('vista-mentor').classList.remove('hidden');
    
    if (!dashboardUserData) {
        console.log('⚠️ Perfil incompleto, mostrando formulario');
        document.getElementById('mentor-perfil-incompleto').classList.remove('hidden');
        document.getElementById('mentor-panel-principal').classList.add('hidden');
        
        document.getElementById('form-completar-perfil-mentor').addEventListener('submit', async (e) => {
            e.preventDefault();
            await completarPerfilMentor(e);
        });
    } else {
        console.log('✅ Perfil completo, cargando datos');
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
    
    console.log('📤 Completando perfil mentor:', data);
    
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=completar-perfil-mentor`, {
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
        console.error('❌ Error:', error);
        alert('❌ Error al completar perfil');
    }
}

async function cargarDatosMentor() {
    console.log('📥 Cargando datos del mentor...');
    
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=get-mentor-data`);
        const data = await response.json();
        
        console.log('📊 Datos recibidos completos:', data);
        console.log('📊 Sesiones:', data.sesiones);
        
        if (!response.ok) {
            console.error('❌ Error:', data.error);
            alert('Error al cargar datos: ' + data.error);
            return;
        }
        
        // Calcular estadísticas
        const totalAprendices = data.aprendices ? data.aprendices.length : 0;
        const sesionesProgramadas = data.sesiones ? data.sesiones.filter(s => s.estado === 'confirmada').length : 0;
        const sesionesCompletadas = data.sesiones ? data.sesiones.filter(s => s.estado === 'completada').length : 0;
        
        document.getElementById('mentor-total-aprendices').textContent = totalAprendices;
        document.getElementById('mentor-sesiones-pendientes').textContent = sesionesProgramadas;
        document.getElementById('mentor-sesiones-completadas').textContent = sesionesCompletadas;
        
        console.log('📊 Estadísticas actualizadas:');
        console.log(`  - Total aprendices: ${totalAprendices}`);
        console.log(`  - Sesiones confirmadas (programadas): ${sesionesProgramadas}`);
        console.log(`  - Sesiones completadas: ${sesionesCompletadas}`);
        
        // Cargar listas
        if (data.sesiones) {
            console.log('🔄 Cargando solicitudes y sesiones programadas...');
            cargarSolicitudesPendientes(data.sesiones);
            cargarSesionesProgramadas(data.sesiones);
        } else {
            document.getElementById('mentor-solicitudes-pendientes').innerHTML = '<p style="color: #6b7280;">No hay solicitudes nuevas</p>';
            document.getElementById('mentor-sesiones-programadas').innerHTML = '<p style="color: #6b7280;">No hay sesiones programadas</p>';
        }
        
        if (data.aprendices) {
            cargarAprendicesMentor(data.aprendices);
        } else {
            document.getElementById('mentor-lista-aprendices').innerHTML = '<p style="color: #6b7280;">No tienes aprendices asignados</p>';
        }
        
        console.log('✅ Datos del mentor cargados completamente');
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        alert('Error al cargar datos del mentor');
    }
}

function cargarSolicitudesPendientes(sesiones) {
    // Filtrar SOLO sesiones con estado 'programada' (sin confirmar)
    const pendientes = sesiones.filter(s => s.estado === 'programada');
    
    console.log(`📋 ${pendientes.length} solicitudes pendientes de confirmación`);
    console.log('📋 Solicitudes pendientes:', pendientes);
    
    const container = document.getElementById('mentor-solicitudes-pendientes');
    
    if (pendientes.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay solicitudes nuevas pendientes de confirmar</p>';
        return;
    }
    
    container.innerHTML = pendientes.map(s => `
        <div class="sesion-item programada" id="solicitud-${s.id}">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${s.tema}</p>
                    <p class="sesion-participantes">Solicitado por: ${s.aprendiz_nombre || 'Aprendiz'}</p>
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
    console.log('====================================');
    console.log('🔍 INICIANDO cargarSesionesProgramadas');
    console.log('📊 Total de sesiones recibidas:', sesiones.length);
    console.log('📋 Todas las sesiones:', sesiones);
    
    // Mostrar cada sesión con su estado
    sesiones.forEach(s => {
        console.log(`  - Sesión ${s.id}: "${s.tema}" - Estado: "${s.estado}"`);
    });
    
    // Filtrar sesiones confirmadas
    const confirmadas = sesiones.filter(s => {
        console.log(`  🔎 Verificando sesión ${s.id}: estado="${s.estado}", ¿es 'confirmada'? ${s.estado === 'confirmada'}`);
        return s.estado === 'confirmada';
    });
    
    console.log(`✅ ${confirmadas.length} sesiones confirmadas encontradas`);
    console.log('📊 Sesiones confirmadas filtradas:', confirmadas);
    console.log('====================================');
    
    const container = document.getElementById('mentor-sesiones-programadas');
    
    if (!container) {
        console.error('❌ CRÍTICO: No se encuentra el contenedor mentor-sesiones-programadas');
        return;
    }
    
    console.log('✅ Contenedor encontrado');
    
    if (confirmadas.length === 0) {
        console.log('⚠️ No hay sesiones confirmadas, mostrando mensaje');
        container.innerHTML = '<p style="color: #6b7280;">No hay sesiones confirmadas pendientes de realizar</p>';
        return;
    }
    
    console.log('🎨 Generando HTML para', confirmadas.length, 'sesiones');
    
    const html = confirmadas.map(s => {
        console.log(`  - Generando HTML para sesión ${s.id}: ${s.tema}`);
        return `
        <div class="sesion-item programada">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${s.tema}</p>
                    <p class="sesion-participantes">Con: ${s.aprendiz_nombre || 'Aprendiz'}</p>
                </div>
                <span class="sesion-badge confirmada">Confirmada</span>
            </div>
            <p class="sesion-fecha">📅 ${s.fecha} a las ${s.hora} - ${s.modalidad}</p>
            <button class="btn btn-success btn-sm" onclick="completarSesionMentor(${s.id})">
                ✓ Marcar como Completada
            </button>
        </div>
    `;
    }).join('');
    
    console.log('📝 HTML generado (primeros 200 caracteres):', html.substring(0, 200));
    container.innerHTML = html;
    console.log('✅ HTML insertado en el contenedor');
    console.log('====================================');
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
    
    console.log('====================================');
    console.log('🔵 INICIANDO confirmación de sesión:', sesionId);
    
    try {
        console.log('📤 Enviando petición al servidor...');
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=confirmar-sesion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesionId })
        });
        
        console.log('📥 Respuesta recibida, status:', response.status);
        const result = await response.json();
        console.log('📊 Resultado parseado:', result);
        
        if (response.ok) {
            console.log('✅ Respuesta exitosa del servidor');
            alert('✅ Sesión confirmada exitosamente');
            
            console.log('🔄 Llamando a cargarDatosMentor()...');
            await cargarDatosMentor();
            console.log('✅ cargarDatosMentor() completado');
        } else {
            console.error('❌ Error en la respuesta:', result.error);
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Excepción capturada:', error);
        alert('❌ Error al confirmar sesión');
    }
    console.log('====================================');
}

async function cargarDatosMentor() {
    console.log('====================================');
    console.log('📥 INICIANDO cargarDatosMentor');
    
    try {
        console.log('📤 Solicitando datos al servidor...');
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=get-mentor-data`);
        
        console.log('📥 Respuesta recibida, status:', response.status);
        const data = await response.json();
        
        console.log('📊 Datos completos recibidos:', data);
        console.log('📊 Número de sesiones:', data.sesiones ? data.sesiones.length : 0);
        
        if (data.sesiones) {
            console.log('📋 Estados de todas las sesiones:');
            data.sesiones.forEach(s => {
                console.log(`  - ID ${s.id}: "${s.tema}" - Estado: "${s.estado}" (tipo: ${typeof s.estado})`);
            });
        }
        
        if (!response.ok) {
            console.error('❌ Error en respuesta:', data.error);
            alert('Error al cargar datos: ' + data.error);
            return;
        }
        
        // Actualizar estadísticas
        const totalAprendices = data.aprendices ? data.aprendices.length : 0;
        const sesionesProgramadas = data.sesiones ? data.sesiones.filter(s => s.estado === 'confirmada').length : 0;
        const sesionesCompletadas = data.sesiones ? data.sesiones.filter(s => s.estado === 'completada').length : 0;
        
        console.log('📊 Estadísticas calculadas:');
        console.log('  - Total aprendices:', totalAprendices);
        console.log('  - Sesiones confirmadas:', sesionesProgramadas);
        console.log('  - Sesiones completadas:', sesionesCompletadas);
        
        document.getElementById('mentor-total-aprendices').textContent = totalAprendices;
        document.getElementById('mentor-sesiones-pendientes').textContent = sesionesProgramadas;
        document.getElementById('mentor-sesiones-completadas').textContent = sesionesCompletadas;
        
        // Cargar listas
        if (data.sesiones) {
            console.log('🔄 Cargando solicitudes pendientes...');
            cargarSolicitudesPendientes(data.sesiones);
            
            console.log('🔄 Cargando sesiones programadas...');
            cargarSesionesProgramadas(data.sesiones);
        } else {
            console.warn('⚠️ No hay sesiones en los datos');
            document.getElementById('mentor-solicitudes-pendientes').innerHTML = '<p style="color: #6b7280;">No hay solicitudes nuevas</p>';
            document.getElementById('mentor-sesiones-programadas').innerHTML = '<p style="color: #6b7280;">No hay sesiones programadas</p>';
        }
        
        if (data.aprendices) {
            cargarAprendicesMentor(data.aprendices);
        }
        
        console.log('✅ cargarDatosMentor completado exitosamente');
        
    } catch (error) {
        console.error('❌ Excepción en cargarDatosMentor:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al cargar datos del mentor');
    }
    console.log('====================================');
}

async function rechazarSesion(sesionId) {
    const motivo = prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return;
    
    console.log('🔵 Rechazando sesión:', sesionId);
    
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=rechazar-sesion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesionId, motivo })
        });
        
        if (response.ok) {
            alert('❌ Sesión rechazada');
            await cargarDatosMentor();
        } else {
            const result = await response.json();
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al rechazar sesión');
    }
}

async function completarSesionMentor(sesionId) {
    const bitacora = prompt('Ingrese las notas de la sesión:');
    if (!bitacora || bitacora.trim() === '') return;
    
    console.log('🔵 Completando sesión:', sesionId);
    
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=completar-sesion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sesionId, bitacora: bitacora.trim() })
        });
        
        if (response.ok) {
            alert('✅ Sesión completada');
            await cargarDatosMentor();
        } else {
            const result = await response.json();
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al completar sesión');
    }
}

// ==================== VISTA APRENDIZ ====================

async function mostrarVistaAprendiz() {
    console.log('🎓 ========== CARGANDO VISTA APRENDIZ ==========');
    console.log('📊 Datos del aprendiz:', dashboardUserData);
    
    const vistaAprendiz = document.getElementById('vista-aprendiz');
    const perfilIncompleto = document.getElementById('aprendiz-perfil-incompleto');
    const panelPrincipal = document.getElementById('aprendiz-panel-principal');
    
    console.log('🔍 Elementos encontrados:');
    console.log('  - vista-aprendiz:', vistaAprendiz ? '✅' : '❌');
    console.log('  - perfil-incompleto:', perfilIncompleto ? '✅' : '❌');
    console.log('  - panel-principal:', panelPrincipal ? '✅' : '❌');
    
    if (!vistaAprendiz) {
        console.error('❌ CRÍTICO: No se encuentra vista-aprendiz');
        return;
    }
    
    vistaAprendiz.classList.remove('hidden');
    console.log('✅ Vista aprendiz visible');
    
    if (!dashboardUserData) {
        console.log('⚠️ PERFIL INCOMPLETO - Mostrando formulario');
        
        if (perfilIncompleto) {
            perfilIncompleto.classList.remove('hidden');
            console.log('✅ Formulario perfil incompleto mostrado');
        }
        
        if (panelPrincipal) {
            panelPrincipal.classList.add('hidden');
        }
        
        const form = document.getElementById('form-completar-perfil-aprendiz');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await completarPerfilAprendiz(e);
            });
            console.log('✅ Evento del formulario configurado');
        }
    } else {
        console.log('✅ PERFIL COMPLETO - Cargando panel principal');
        
        if (perfilIncompleto) {
            perfilIncompleto.classList.add('hidden');
        }
        
        if (panelPrincipal) {
            panelPrincipal.classList.remove('hidden');
            console.log('✅ Panel principal mostrado');
        }
        
        await cargarDatosAprendiz();
    }
    
    console.log('========== FIN VISTA APRENDIZ ==========');
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
    
    console.log('📤 Completando perfil aprendiz:', data);
    
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=completar-perfil-aprendiz`, {
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
        console.error('❌ Error:', error);
        alert('❌ Error al completar perfil');
    }
}

async function cargarDatosAprendiz() {
    console.log('📥 Cargando datos del aprendiz...');
    
    try {
        const response = await fetch(`${DASHBOARD_AUTH_URL}?action=get-aprendiz-data`);
        const data = await response.json();
        
        console.log('📊 Datos recibidos:', data);
        
        if (!response.ok) {
            console.error('❌ Error:', data.error);
            alert('Error al cargar datos: ' + data.error);
            return;
        }
        
        const mentorInfo = document.getElementById('aprendiz-mentor-info');
        const formSolicitar = document.getElementById('form-solicitar-sesion');
        const buscarMentorSection = document.getElementById('aprendiz-buscar-mentor');
        
        if (data.mentor) {
            console.log('✅ Tiene mentor asignado:', data.mentor.nombre);
            
            if (buscarMentorSection) {
                buscarMentorSection.style.display = 'none';
            }
            
            if (mentorInfo) {
                const materias = data.mentor.materias || [];
                
                mentorInfo.innerHTML = `
                    <div class="mentor-activo-card">
                        <div>
                            <h4>Tu Mentor: ${data.mentor.nombre}</h4>
                            <p>${data.mentor.carrera} - Semestre ${data.mentor.semestre}</p>
                            <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                                📅 ${data.mentor.disponibilidad}
                            </p>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;">
                                ${materias.slice(0, 3).map(m => 
                                    `<span class="tag materia">${m}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (formSolicitar) {
                formSolicitar.classList.remove('hidden');
                formSolicitar.onsubmit = async (e) => {
                    e.preventDefault();
                    await solicitarSesion(e, data.emparejamiento.id);
                };
            }
        } else {
            console.log('⚠️ NO tiene mentor asignado');
            
            if (buscarMentorSection) {
                buscarMentorSection.style.display = 'block';
            }
            
            if (mentorInfo) {
                mentorInfo.innerHTML = `
                    <div class="alert warning">
                        <p>⚠️ Aún no tienes un mentor asignado. Puedes buscar mentores disponibles abajo.</p>
                    </div>
                `;
            }
            
            if (formSolicitar) {
                formSolicitar.classList.add('hidden');
            }
            
            await cargarMentoresDisponibles(data.aprendiz);
        }
        
        if (data.sesiones && data.mentor) {
            cargarSesionesAprendiz(data.sesiones, data.mentor);
        } else {
            const sesionesContainer = document.getElementById('aprendiz-sesiones');
            if (sesionesContainer) {
                sesionesContainer.innerHTML = '<p style="color: #6b7280;">No tienes sesiones programadas</p>';
            }
        }
        
        console.log('✅ Datos del aprendiz cargados completamente');
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        alert('Error al cargar datos del aprendiz');
    }
}

async function cargarMentoresDisponibles(aprendiz) {
    console.log('🔍 Cargando mentores disponibles...');
    
    try {
        const mentores = await DB.getMentores();
        console.log('📊 Mentores encontrados:', mentores.length);
        
        if (mentores.length === 0) {
            document.getElementById('aprendiz-lista-mentores').innerHTML = 
                '<p style="color: #6b7280;">No hay mentores disponibles en este momento.</p>';
            return;
        }
        
        const mentoresConCompatibilidad = mentores.map(mentor => ({
            ...mentor,
            compatibilidad: calcularCompatibilidad(mentor, aprendiz)
        })).sort((a, b) => b.compatibilidad - a.compatibilidad);
        
        mostrarMentoresDisponibles(mentoresConCompatibilidad, aprendiz);
        
    } catch (error) {
        console.error('❌ Error al cargar mentores:', error);
    }
}

function calcularCompatibilidad(mentor, aprendiz) {
    let score = 0;
    
    if (mentor.carrera === aprendiz.carrera) {
        score += 40;
    }
    
    const materiasComunes = mentor.materias.filter(m =>
        aprendiz.materias.some(am => 
            am.toLowerCase().includes(m.toLowerCase()) || 
            m.toLowerCase().includes(am.toLowerCase())
        )
    ).length;
    score += materiasComunes * 20;
    
    const habilidadesComunes = mentor.habilidades.filter(h =>
        aprendiz.habilidades.some(ah => 
            ah.toLowerCase().includes(h.toLowerCase()) || 
            h.toLowerCase().includes(ah.toLowerCase())
        )
    ).length;
    score += habilidadesComunes * 10;
    
    return Math.min(score, 100);
}

function mostrarMentoresDisponibles(mentores, aprendiz) {
    const container = document.getElementById('aprendiz-lista-mentores');
    
    if (!container) {
        console.error('❌ No se encuentra el contenedor');
        return;
    }
    
    const topMentores = mentores.slice(0, 5);
    
    container.innerHTML = `
        <p style="margin-bottom: 1rem; color: #6b7280;">
            Encontramos ${topMentores.length} mentores compatibles con tu perfil.
        </p>
        ${topMentores.map(mentor => {
            const compatClass = mentor.compatibilidad >= 70 ? 'high' : 
                               mentor.compatibilidad >= 50 ? 'medium' : 'low';
            
            return `
                <div class="mentor-card">
                    <div class="mentor-info">
                        <div class="mentor-header">
                            <h4 class="mentor-name">${mentor.nombre}</h4>
                            <span class="compatibility-badge ${compatClass}">
                                ${mentor.compatibilidad}% Compatible
                            </span>
                        </div>
                        <p class="mentor-details">${mentor.carrera} - Semestre ${mentor.semestre}</p>
                        <div class="tags-container">
                            <span style="font-size: 0.875rem; color: #6b7280; margin-right: 0.5rem;">Materias:</span>
                            ${mentor.materias.slice(0, 3).map(m => `<span class="tag materia">${m}</span>`).join('')}
                            ${mentor.materias.length > 3 ? `<span class="tag materia">+${mentor.materias.length - 3}</span>` : ''}
                        </div>
                        <div class="tags-container">
                            <span style="font-size: 0.875rem; color: #6b7280; margin-right: 0.5rem;">Habilidades:</span>
                            ${mentor.habilidades.slice(0, 3).map(h => `<span class="tag habilidad">${h}</span>`).join('')}
                            ${mentor.habilidades.length > 3 ? `<span class="tag habilidad">+${mentor.habilidades.length - 3}</span>` : ''}
                        </div>
                        <p class="mentor-details" style="margin-top: 0.5rem;">
                            📅 ${mentor.disponibilidad}
                        </p>
                    </div>
                    <button class="btn btn-primary" onclick="solicitarMentor(${mentor.id}, ${aprendiz.id})">
                        Solicitar Mentor
                    </button>
                </div>
            `;
        }).join('')}
    `;
}

async function solicitarMentor(mentorId, aprendizId) {
    if (!confirm('¿Deseas solicitar a este mentor?')) return;
    
    try {
        const resultado = await DB.addEmparejamiento({
            mentorId: mentorId,
            aprendizId: aprendizId
        });
        
        if (resultado) {
            alert('✅ ¡Solicitud enviada! Ahora puedes agendar sesiones con tu mentor.');
            await cargarDatosAprendiz();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al solicitar mentor');
    }
}

async function solicitarSesion(e, emparejamientoId) {
    const formData = new FormData(e.target);
    
    try {
        await DB.addSesion({
            emparejamientoId: emparejamientoId,
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            tema: formData.get('tema'),
            modalidad: formData.get('modalidad'),
            estado: 'programada'
        });
        
        alert('✅ Sesión solicitada exitosamente. Tu mentor la revisará pronto.');
        e.target.reset();
        await cargarDatosAprendiz();
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al solicitar sesión');
    }
}

function cargarSesionesAprendiz(sesiones, mentor) {
    console.log('📅 Cargando sesiones del aprendiz...');
    
    const container = document.getElementById('aprendiz-sesiones');
    
    if (!sesiones || sesiones.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No tienes sesiones programadas</p>';
        return;
    }
    
    container.innerHTML = sesiones.map(s => {
        let estadoLabel = s.estado;
        let estadoClass = s.estado;
        
        if (s.estado === 'programada') {
            estadoLabel = 'Pendiente de confirmar';
            estadoClass = 'programada';
        } else if (s.estado === 'confirmada') {
            estadoLabel = 'Confirmada';
            estadoClass = 'programada';
    }
    
    return `
        <div class="sesion-item ${estadoClass}">
            <div class="sesion-header">
                <div>
                    <p class="sesion-tema">${s.tema}</p>
                    <p class="sesion-participantes">Con: ${mentor.nombre}</p>
                </div>
                <span class="sesion-badge ${estadoClass}">${estadoLabel}</span>
            </div>
            <p class="sesion-fecha">📅 ${s.fecha} a las ${s.hora} - ${s.modalidad}</p>
            ${s.bitacora ? `
                <p class="sesion-bitacora">
                    <strong>Notas:</strong> ${s.bitacora}
                </p>
            ` : ''}
        </div>
    `;
}).join('');
}
// ==================== LOGOUT ====================
async function logout() {
console.log('👋 Cerrando sesión...');
try {
    await fetch(`${DASHBOARD_AUTH_URL}?action=logout`, { method: 'POST' });
    window.location.href = 'index.html';
} catch (error) {
    console.error('❌ Error:', error);
    window.location.href = 'index.html';
}
}
// Exponer funciones globalmente
window.logout = logout;
window.confirmarSesion = confirmarSesion;
window.rechazarSesion = rechazarSesion;
window.completarSesionMentor = completarSesionMentor;
window.solicitarMentor = solicitarMentor;
console.log('✅ dashboard.js cargado completamente');