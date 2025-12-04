/**
 * api.js - Cliente para comunicación con el backend PHP
 * Versión actualizada para MySQL/XAMPP
 */

// Detectar la ruta automáticamente
const BASE_PATH = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
const API_URL = window.location.origin + BASE_PATH + '/api.php';

console.log('🔗 API URL configurada:', API_URL);

const DB = {
    /**
     * Inicializar conexión con el servidor
     */
    async init() {
        try {
            const response = await fetch(`${API_URL}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Conexión con el servidor establecida');
                console.log('📊 Estado:', data);
                return true;
            }
            throw new Error('Servidor no disponible');
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            alert('No se pudo conectar con el servidor.\n\nAsegúrate de que:\n1. La pagina esta en linea\n2. Si necesita ayuda contacte con la pagina');
            return false;
        }
    },

    /**
     * Obtener todos los mentores
     */
    async getMentores() {
        try {
            const response = await fetch(`${API_URL}/mentores`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('📚 Mentores obtenidos:', data.length);
            return data;
        } catch (error) {
            console.error('Error al obtener mentores:', error);
            return [];
        }
    },

    /**
     * Obtener todos los aprendices
     */
    async getAprendices() {
        try {
            const response = await fetch(`${API_URL}/aprendices`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('🎓 Aprendices obtenidos:', data.length);
            return data;
        } catch (error) {
            console.error('Error al obtener aprendices:', error);
            return [];
        }
    },

    /**
     * Obtener todos los emparejamientos
     */
    async getEmparejamientos() {
        try {
            const response = await fetch(`${API_URL}/emparejamientos`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Emparejamientos obtenidos:', data.length);
            return data;
        } catch (error) {
            console.error('Error al obtener emparejamientos:', error);
            return [];
        }
    },

    /**
     * Obtener todas las sesiones
     */
    async getSesiones() {
        try {
            const response = await fetch(`${API_URL}/sesiones`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('📅 Sesiones obtenidas:', data.length);
            return data;
        } catch (error) {
            console.error('❌ Error al obtener sesiones:', error);
            return [];
        }
    },

    /**
     * Agregar un nuevo mentor
     */
    async addMentor(mentor) {
        try {
            console.log('➕ Agregando mentor:', mentor);
            const response = await fetch(`${API_URL}/mentores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mentor)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al agregar mentor');
            }
            
            const result = await response.json();
            console.log('✅ Mentor agregado con ID:', result.id);
            return result;
        } catch (error) {
            console.error('❌ Error al agregar mentor:', error);
            alert('Error al agregar mentor: ' + error.message);
            return null;
        }
    },

    /**
     * Agregar un nuevo aprendiz
     */
    async addAprendiz(aprendiz) {
        try {
            console.log('➕ Agregando aprendiz:', aprendiz);
            const response = await fetch(`${API_URL}/aprendices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aprendiz)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al agregar aprendiz');
            }
            
            const result = await response.json();
            console.log('✅ Aprendiz agregado con ID:', result.id);
            return result;
        } catch (error) {
            console.error('❌ Error al agregar aprendiz:', error);
            alert('Error al agregar aprendiz: ' + error.message);
            return null;
        }
    },

    /**
     * Crear un nuevo emparejamiento
     */
    async addEmparejamiento(emparejamiento) {
        try {
            console.log('➕ Creando emparejamiento:', emparejamiento);
            const response = await fetch(`${API_URL}/emparejamientos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emparejamiento)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear emparejamiento');
            }
            
            const result = await response.json();
            console.log('✅ Emparejamiento creado con ID:', result.id);
            return result;
        } catch (error) {
            console.error('❌ Error al crear emparejamiento:', error);
            alert('Error al crear emparejamiento: ' + error.message);
            return null;
        }
    },

    /**
     * Programar una nueva sesión
     */
    async addSesion(sesion) {
        try {
            console.log('➕ Programando sesión:', sesion);
            const response = await fetch(`${API_URL}/sesiones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sesion)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al programar sesión');
            }
            
            const result = await response.json();
            console.log('✅ Sesión programada con ID:', result.id);
            return result;
        } catch (error) {
            console.error('❌ Error al programar sesión:', error);
            alert('Error al programar sesión: ' + error.message);
            return null;
        }
    },

    /**
     * Actualizar una sesión existente
     */
    async updateSesion(id, updates) {
        try {
            console.log('🔄 Actualizando sesión:', id, updates);
            const response = await fetch(`${API_URL}/sesiones/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar sesión');
            }
            
            const result = await response.json();
            console.log('✅ Sesión actualizada:', result.message);
            return true;
        } catch (error) {
            console.error('❌ Error al actualizar sesión:', error);
            alert('Error al actualizar sesión: ' + error.message);
            return false;
        }
    },

    /**
     * Obtener un mentor por ID
     */
    async getMentorById(id) {
        try {
            const response = await fetch(`${API_URL}/mentores/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('⚠️ Mentor no encontrado:', id);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('👨‍🏫 Mentor obtenido:', data.nombre);
            return data;
        } catch (error) {
            console.error('❌ Error al obtener mentor:', error);
            return null;
        }
    },

    /**
     * Obtener un aprendiz por ID
     */
    async getAprendizById(id) {
        try {
            const response = await fetch(`${API_URL}/aprendices/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('⚠️ Aprendiz no encontrado:', id);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('🎓 Aprendiz obtenido:', data.nombre);
            return data;
        } catch (error) {
            console.error('❌ Error al obtener aprendiz:', error);
            return null;
        }
    },

    /**
     * Verificar si un aprendiz ya tiene mentor asignado
     */
    async aprendizTieneMentor(aprendizId) {
        try {
            const response = await fetch(`${API_URL}/aprendices/${aprendizId}/tiene-mentor`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log(`🔍 Aprendiz ${aprendizId} tiene mentor:`, result.tieneMentor);
            return result.tieneMentor;
        } catch (error) {
            console.error('❌ Error al verificar mentor:', error);
            return false;
        }
    },

    /**
     * Obtener sesiones de un emparejamiento específico
     */
    async getSesionesByEmparejamiento(emparejamientoId) {
        try {
            const response = await fetch(`${API_URL}/sesiones/emparejamiento/${emparejamientoId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`📅 Sesiones del emparejamiento ${emparejamientoId}:`, data.length);
            return data;
        } catch (error) {
            console.error('❌ Error al obtener sesiones:', error);
            return [];
        }
    },

    /**
     * Limpiar todas las tablas (CUIDADO: Elimina todos los datos)
     */
    async clearAll() {
        try {
            if (!confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos.\n¿Estás seguro?')) {
                return false;
            }
            
            console.log('🗑️ Limpiando base de datos...');
            const response = await fetch(`${API_URL}/clear-all`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Error al limpiar base de datos');
            }
            
            const result = await response.json();
            console.log('✅ Base de datos limpiada:', result.message);
            alert('✅ Base de datos limpiada exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al limpiar base de datos:', error);
            alert('Error al limpiar base de datos: ' + error.message);
            return false;
        }
    },

    /**
     * Exportar todos los datos
     */
    async exportData() {
        try {
            console.log('📦 Exportando datos...');
            const response = await fetch(`${API_URL}/export`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('✅ Datos exportados exitosamente');
            
            // Crear y descargar archivo JSON
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mentor-match-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return data;
        } catch (error) {
            console.error('❌ Error al exportar datos:', error);
            alert('Error al exportar datos: ' + error.message);
            return null;
        }
    },

    /**
     * Funciones heredadas (compatibilidad)
     */
    saveDatabase() {
        console.log('ℹ️ Esta función no es necesaria con MySQL');
    },
    
    createTables() {
        console.log('ℹ️ Las tablas se crean desde phpMyAdmin con mentoria_database.sql');
    },
    
    generateTestData() {
        console.log('ℹ️ Los datos de prueba se insertan desde phpMyAdmin o db/quick_reset.php');
    },
    
    downloadDatabase() {
        console.log('ℹ️ Para hacer backup de MySQL, usa phpMyAdmin o db/manager.php');
    }
};

// Exponer DB globalmente
window.DB = DB;