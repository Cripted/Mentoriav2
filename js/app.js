/**
 * App.js - Lógica principal (versión asíncrona)
 */

let currentTab = 'dashboard';
let tipoRegistro = 'mentor';

document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    await loadDashboard();
});

async function initializeApp() {
    console.log('🚀 Iniciando Mentor-Match...');
    
    if (typeof DB === 'undefined') {
        console.error('❌ Error: api.js no está cargado');
        alert('Error: No se pudo cargar el cliente API');
        return;
    }
    
    const connected = await DB.init();
    if (connected) {
        console.log('✅ Aplicación inicializada correctamente');
    }
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => switchRegistroTipo(btn.dataset.tipo));
    });

    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', handleRegistroSubmit);
    }

    const selectAprendiz = document.getElementById('select-aprendiz');
    const btnBuscar = document.getElementById('btn-buscar-mentores');
    
    if (selectAprendiz && btnBuscar) {
        selectAprendiz.addEventListener('change', (e) => {
            btnBuscar.disabled = !e.target.value;
        });
        btnBuscar.addEventListener('click', buscarMentores);
    }

    const formSesion = document.getElementById('form-sesion');
    if (formSesion) {
        formSesion.addEventListener('submit', handleSesionSubmit);
    }
}

async function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;

    switch(tabName) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'emparejamiento':
            await loadEmparejamientoData();
            break;
        case 'sesiones':
            await loadSesionesData();
            break;
        case 'reportes':
            await loadReportes();
            break;
    }
}

function switchRegistroTipo(tipo) {
    tipoRegistro = tipo;
    document.querySelectorAll('.tipo-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');
    document.getElementById('btn-registro-text').textContent = 
        tipo === 'mentor' ? 'Registrar Mentor' : 'Registrar Aprendiz';
}

async function handleRegistroSubmit(e) {
    e.preventDefault();

    const formData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        carrera: document.getElementById('carrera').value,
        semestre: document.getElementById('semestre').value,
        materias: document.getElementById('materias').value.split(',').map(m => m.trim()),
        habilidades: document.getElementById('habilidades').value.split(',').map(h => h.trim()),
        disponibilidad: document.getElementById('disponibilidad').value
    };

    if (tipoRegistro === 'mentor') {
        await DB.addMentor(formData);
        alert('✅ Mentor registrado exitosamente');
    } else {
        await DB.addAprendiz(formData);
        alert('✅ Aprendiz registrado exitosamente');
    }

    e.target.reset();
    
    if (currentTab === 'dashboard') {
        await loadDashboard();
    }
}

async function loadDashboard() {
    const [mentores, aprendices, emparejamientos, sesiones] = await Promise.all([
        DB.getMentores(),
        DB.getAprendices(),
        DB.getEmparejamientos(),
        DB.getSesiones()
    ]);

    document.getElementById('total-mentores').textContent = mentores.length;
    document.getElementById('total-aprendices').textContent = aprendices.length;
    document.getElementById('total-emparejamientos').textContent = emparejamientos.length;
    document.getElementById('sesiones-completadas').textContent = 
        sesiones.filter(s => s.estado === 'completada').length;

    const aprendicesSinMentor = aprendices.length - emparejamientos.length;
    const alertContainer = document.getElementById('alert-container');
    
    if (aprendicesSinMentor > 0) {
        alertContainer.innerHTML = `
            <div class="alert warning">
                <span style="font-size: 1.5rem;">⚠️</span>
                <p><strong>Atención:</strong> Hay ${aprendicesSinMentor} aprendices sin mentor asignado.</p>
            </div>
        `;
    } else {
        alertContainer.innerHTML = '';
    }

    loadProximasSesiones(sesiones, emparejamientos, mentores, aprendices);
    loadCarrerasTop(emparejamientos, mentores);
}

function loadProximasSesiones(sesiones, emparejamientos, mentores, aprendices) {
    const proximasSesiones = sesiones
        .filter(s => s.estado === 'programada')
        .slice(0, 5);

    const container = document.getElementById('proximas-sesiones');
    
    if (proximasSesiones.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay sesiones programadas</p>';
        return;
    }

    container.innerHTML = proximasSesiones.map(sesion => {
        const emp = emparejamientos.find(e => e.id === parseInt(sesion.emparejamiento_id));
        const mentor = mentores.find(m => m.id === emp?.mentor_id);
        const aprendiz = aprendices.find(a => a.id === emp?.aprendiz_id);

        return `
            <div class="list-item">
                <div>
                    <p style="font-weight: 500;">${mentor?.nombre || 'N/A'} → ${aprendiz?.nombre || 'N/A'}</p>
                    <p style="font-size: 0.875rem; color: #6b7280;">${sesion.fecha} a las ${sesion.hora}</p>
                </div>
                <span style="font-size: 1.25rem;">🕐</span>
            </div>
        `;
    }).join('');
}

function loadCarrerasTop(emparejamientos, mentores) {
    const carrerasCount = {};
    
    emparejamientos.forEach(emp => {
        const mentor = mentores.find(m => m.id === emp.mentor_id);
        if (mentor) {
            carrerasCount[mentor.carrera] = (carrerasCount[mentor.carrera] || 0) + 1;
        }
    });

    const topCarreras = Object.entries(carrerasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const container = document.getElementById('carreras-top');
    
    if (topCarreras.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = topCarreras.map(([carrera, count]) => `
        <div class="list-item">
            <p style="font-weight: 500;">${carrera}</p>
            <span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">
                ${count}
            </span>
        </div>
    `).join('');
}

async function loadEmparejamientoData() {
    const aprendices = await DB.getAprendices();
    const select = document.getElementById('select-aprendiz');
    
    select.innerHTML = '<option value="">Seleccionar Aprendiz</option>' +
        aprendices.map(a => `
            <option value="${a.id}">
                ${a.nombre} - ${a.carrera} (Sem. ${a.semestre})
            </option>
        `).join('');
}

async function buscarMentores() {
    const aprendizId = parseInt(document.getElementById('select-aprendiz').value);
    const aprendiz = await DB.getAprendizById(aprendizId);
    
    if (!aprendiz) {
        alert('Por favor selecciona un aprendiz');
        return;
    }

    const tieneMentor = await DB.aprendizTieneMentor(aprendizId);
    if (tieneMentor) {
        alert('⚠️ Este aprendiz ya tiene un mentor asignado');
        return;
    }

    const mentores = await DB.getMentores();
    const mentoresSugeridos = mentores
        .map(mentor => ({
            ...mentor,
            compatibilidad: calcularCompatibilidad(mentor, aprendiz)
        }))
        .sort((a, b) => b.compatibilidad - a.compatibilidad)
        .slice(0, 5);

    mostrarMentoresSugeridos(mentoresSugeridos, aprendizId);
}

function calcularCompatibilidad(mentor, aprendiz) {
    let score = 0;

    if (mentor.carrera === aprendiz.carrera) {
        score += 40;
    }

    const materiasComunes = mentor.materias.filter(m =>
        aprendiz.materias.some(am => am.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(am.toLowerCase()))
    ).length;
    score += materiasComunes * 20;

    const habilidadesComunes = mentor.habilidades.filter(h =>
        aprendiz.habilidades.some(ah => ah.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(ah.toLowerCase()))
    ).length;
    score += habilidadesComunes * 10;

    return Math.min(score, 100);
}

function mostrarMentoresSugeridos(mentores, aprendizId) {
    const container = document.getElementById('mentores-sugeridos');

    if (mentores.length === 0) {
        container.innerHTML = '<div class="card"><p>No se encontraron mentores disponibles</p></div>';
        return;
    }

    container.innerHTML = `
        <h3 style="margin-top: 1.5rem; margin-bottom: 1rem;">Mentores Sugeridos</h3>
        ${mentores.map(mentor => {
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
                            ${mentor.materias.map(m => `<span class="tag materia">${m}</span>`).join('')}
                        </div>
                        <div class="tags-container">
                            <span style="font-size: 0.875rem; color: #6b7280; margin-right: 0.5rem;">Habilidades:</span>
                            ${mentor.habilidades.map(h => `<span class="tag habilidad">${h}</span>`).join('')}
                        </div>
                        <p class="mentor-details" style="margin-top: 0.5rem;">
                            📅 ${mentor.disponibilidad}
                        </p>
                    </div>
                    <button class="btn btn-success" onclick="asignarMentor(${mentor.id}, ${aprendizId})">
                        Asignar
                    </button>
                </div>
            `;
        }).join('')}
    `;
}

async function asignarMentor(mentorId, aprendizId) {
    await DB.addEmparejamiento({
        mentorId,
        aprendizId
    });

    alert('✅ Emparejamiento creado exitosamente');
    
    document.getElementById('select-aprendiz').value = '';
    document.getElementById('btn-buscar-mentores').disabled = true;
    document.getElementById('mentores-sugeridos').innerHTML = '';
    
    await loadEmparejamientoData();
    if (currentTab === 'dashboard') {
        await loadDashboard();
    }
}

async function loadSesionesData() {
    const [emparejamientos, mentores, aprendices] = await Promise.all([
        DB.getEmparejamientos(),
        DB.getMentores(),
        DB.getAprendices()
    ]);
    
    const select = document.getElementById('select-emparejamiento');
    select.innerHTML = '<option value="">Seleccionar</option>' +
        emparejamientos.map(emp => {
            const mentor = mentores.find(m => m.id === emp.mentor_id);
            const aprendiz = aprendices.find(a => a.id === emp.aprendiz_id);
            return `
                <option value="${emp.id}">
                    ${mentor?.nombre || 'N/A'} → ${aprendiz?.nombre || 'N/A'}
                </option>
            `;
        }).join('');

    await loadListaSesiones();
}

async function loadListaSesiones() {
    const [sesiones, emparejamientos, mentores, aprendices] = await Promise.all([
        DB.getSesiones(),
        DB.getEmparejamientos(),
        DB.getMentores(),
        DB.getAprendices()
    ]);
    
    const container = document.getElementById('lista-sesiones');
    
    if (sesiones.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay sesiones registradas</p>';
        return;
    }

    const sesionesSorted = [...sesiones].reverse();
    
    container.innerHTML = sesionesSorted.map(sesion => {
        const emp = emparejamientos.find(e => e.id === parseInt(sesion.emparejamiento_id));
        const mentor = mentores.find(m => m.id === emp?.mentor_id);
        const aprendiz = aprendices.find(a => a.id === emp?.aprendiz_id);

        return `
            <div class="sesion-item ${sesion.estado}">
                <div class="sesion-header">
                    <div>
                        <p class="sesion-tema">${sesion.tema}</p>
                        <p class="sesion-participantes">
                            ${mentor?.nombre || 'N/A'} → ${aprendiz?.nombre || 'N/A'}
                        </p>
                    </div>
                    <span class="sesion-badge ${sesion.estado}">
                        ${sesion.estado}
                    </span>
                </div>
                <p class="sesion-fecha">
                    ${sesion.fecha} a las ${sesion.hora} - ${sesion.modalidad}
                </p>
                ${sesion.estado === 'programada' ? `
                    <button class="btn btn-success btn-sm" onclick="completarSesion(${sesion.id})">
                        Marcar como Completada
                    </button>
                ` : ''}
                ${sesion.bitacora ? `
                    <p class="sesion-bitacora">
                        <strong>Notas:</strong> ${sesion.bitacora}
                    </p>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function handleSesionSubmit(e) {
    e.preventDefault();

    const sesionData = {
        emparejamientoId: document.getElementById('select-emparejamiento').value,
        fecha: document.getElementById('fecha-sesion').value,
        hora: document.getElementById('hora-sesion').value,
        tema: document.getElementById('tema-sesion').value,
        modalidad: document.getElementById('modalidad-sesion').value,
        estado: 'programada'
    };

    await DB.addSesion(sesionData);
    alert('✅ Sesión programada exitosamente');

    e.target.reset();
    await loadListaSesiones();
}

async function completarSesion(sesionId) {
    const bitacora = prompt('Ingrese las notas de la sesión:');
    
    if (bitacora !== null && bitacora.trim() !== '') {
        await DB.updateSesion(sesionId, {
            estado: 'completada',
            bitacora: bitacora.trim(),
            fechaCompletada: new Date().toISOString()
        });

        alert('✅ Sesión marcada como completada');
        await loadListaSesiones();
        
        if (currentTab === 'dashboard') {
            await loadDashboard();
        }
    }
}

async function loadReportes() {
    const [sesiones, emparejamientos, mentores, aprendices] = await Promise.all([
        DB.getSesiones(),
        DB.getEmparejamientos(),
        DB.getMentores(),
        DB.getAprendices()
    ]);

    const totalSesiones = sesiones.length;
    const sesionesCompletadas = sesiones.filter(s => s.estado === 'completada').length;
    const tasaCompletacion = totalSesiones > 0 
        ? ((sesionesCompletadas / totalSesiones) * 100).toFixed(1) 
        : 0;

    document.getElementById('reporte-total-sesiones').textContent = totalSesiones;
    document.getElementById('reporte-sesiones-completadas').textContent = sesionesCompletadas;
    document.getElementById('tasa-completacion').textContent = tasaCompletacion + '%';

    loadTablaEmparejamientos(emparejamientos, mentores, aprendices, sesiones);
    loadMentoresActivos(emparejamientos, mentores, sesiones);
}

function loadTablaEmparejamientos(emparejamientos, mentores, aprendices, sesiones) {
    const tbody = document.querySelector('#tabla-emparejamientos tbody');
    
    if (emparejamientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay emparejamientos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = emparejamientos.map(emp => {
        const mentor = mentores.find(m => m.id === emp.mentor_id);
        const aprendiz = aprendices.find(a => a.id === emp.aprendiz_id);
        const sesionesDePar = sesiones.filter(s => parseInt(s.emparejamiento_id) === emp.id);
        const fecha = emp.fecha_creacion ? new Date(emp.fecha_creacion).toLocaleDateString() : 'N/A';

        return `
            <tr>
                <td>${mentor?.nombre || 'N/A'}</td>
                <td>${aprendiz?.nombre || 'N/A'}</td>
                <td>${mentor?.carrera || 'N/A'}</td>
                <td>${sesionesDePar.length}</td>
                <td>${fecha}</td>
            </tr>
        `;
    }).join('');
}

function loadMentoresActivos(emparejamientos, mentores, sesiones) {
    const mentoresData = {};

    emparejamientos.forEach(emp => {
        const mentor = mentores.find(m => m.id === emp.mentor_id);
        if (mentor) {
            const sesionesMentor = sesiones.filter(s => 
                parseInt(s.emparejamiento_id) === emp.id
            ).length;

            if (!mentoresData[mentor.id]) {
                mentoresData[mentor.id] = {
                    nombre: mentor.nombre,
                    sesiones: 0,
                    aprendices: 0
                };
            }
            mentoresData[mentor.id].sesiones += sesionesMentor;
            mentoresData[mentor.id].aprendices += 1;
        }
    });

    const topMentores = Object.values(mentoresData)
        .sort((a, b) => b.sesiones - a.sesiones)
        .slice(0, 5);

    const container = document.getElementById('mentores-activos');
    
    if (topMentores.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = topMentores.map(data => `
        <div class="mentor-activo-card">
            <div class="mentor-activo-info">
                <h4>${data.nombre}</h4>
                <p>${data.aprendices} aprendiz(es)</p>
            </div>
            <span class="mentor-activo-badge">
                ${data.sesiones} sesiones
            </span>
        </div>
    `).join('');
}

window.asignarMentor = asignarMentor;
window.completarSesion = completarSesion;