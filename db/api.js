/**
 * api.js - Cliente para comunicación con el backend PHP
 */

// Detectar la ruta automáticamente
const BASE_PATH = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
const API_URL = window.location.origin + BASE_PATH + '/api.php';

const DB = {
    async init() {
        try {
            const response = await fetch(`${API_URL}`);
            if (response.ok) {
                console.log('✅ Conexión con el servidor establecida');
                return true;
            }
            throw new Error('Servidor no disponible');
        } catch (error) {
            console.error('❌ Error al conectar con el servidor:', error);
            alert('No se pudo conectar con el servidor. Asegúrate de que XAMPP esté corriendo');
            return false;
        }
    },

    async getMentores() {
        try {
            const response = await fetch(`${API_URL}/mentores`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener mentores:', error);
            return [];
        }
    },

    async getAprendices() {
        try {
            const response = await fetch(`${API_URL}/aprendices`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener aprendices:', error);
            return [];
        }
    },

    async getEmparejamientos() {
        try {
            const response = await fetch(`${API_URL}/emparejamientos`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener emparejamientos:', error);
            return [];
        }
    },

    async getSesiones() {
        try {
            const response = await fetch(`${API_URL}/sesiones`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener sesiones:', error);
            return [];
        }
    },

    async addMentor(mentor) {
        try {
            const response = await fetch(`${API_URL}/mentores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mentor)
            });
            
            if (!response.ok) {
                throw new Error('Error al agregar mentor');
            }
            
            const result = await response.json();
            console.log('✅ Mentor agregado con ID:', result.id);
            return result;
        } catch (error) {
            console.error('Error al agregar mentor:', error);
            return null;
        }
    },

    async addAprendiz(aprendiz) {
        try {
            const response = await fetch(`${API_URL}/aprendices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aprendiz)
            });
            
            if (!response.ok) {
                throw new Error('Error al agregar aprendiz');
            }
            
            const result = await response.json();
            console.log('✅ Aprendiz agregado con ID:', result.id);
            return result;
        } catch (error) {
            console.error('Error al agregar aprendiz:', error);
            return null;
        }
    },

    async addEmparejamiento(emparejamiento) {
        try {
            const response = await fetch(`${API_URL}/emparejamientos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emparejamiento)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear emparejamiento');
            }
            
            const result = await response.json();
            console.log('✅ Emparejamiento creado con ID:', result.id);
            return result;
        } catch (error) {
            console.error('Error al crear emparejamiento:', error);
            alert(error.message);
            return null;
        }
    },

    async addSesion(sesion) {
        try {
            const response = await fetch(`${API_URL}/sesiones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sesion)
            });
            
            if (!response.ok) {
                throw new Error('Error al programar sesión');
            }
            
            const result = await response.json();
            console.log('✅ Sesión programada con ID:', result.id);
            return result;
        } catch (error) {
            console.error('Error al programar sesión:', error);
            return null;
        }
    },

    async updateSesion(id, updates) {
        try {
            const response = await fetch(`${API_URL}/sesiones/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar sesión');
            }
            
            console.log('✅ Sesión actualizada');
            return true;
        } catch (error) {
            console.error('Error al actualizar sesión:', error);
            return false;
        }
    },

    async getMentorById(id) {
        try {
            const response = await fetch(`${API_URL}/mentores/${id}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error al obtener mentor:', error);
            return null;
        }
    },

    async getAprendizById(id) {
        try {
            const response = await fetch(`${API_URL}/aprendices/${id}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error al obtener aprendiz:', error);
            return null;
        }
    },

    async aprendizTieneMentor(aprendizId) {
        try {
            const response = await fetch(`${API_URL}/aprendices/${aprendizId}/tiene-mentor`);
            const result = await response.json();
            return result.tieneMentor;
        } catch (error) {
            console.error('Error al verificar mentor:', error);
            return false;
        }
    },

    async getSesionesByEmparejamiento(emparejamientoId) {
        try {
            const response = await fetch(`${API_URL}/sesiones/emparejamiento/${emparejamientoId}`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener sesiones:', error);
            return [];
        }
    },

    async clearAll() {
        try {
            const response = await fetch(`${API_URL}/clear-all`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Error al limpiar base de datos');
            }
            
            console.log('🗑️ Base de datos limpiada');
            return true;
        } catch (error) {
            console.error('Error al limpiar base de datos:', error);
            return false;
        }
    },

    async exportData() {
        try {
            const response = await fetch(`${API_URL}/export`);
            return await response.json();
        } catch (error) {
            console.error('Error al exportar datos:', error);
            return null;
        }
    },

    saveDatabase() {},
    createTables() {},
    generateTestData() {
        console.log('Esta función debe ejecutarse desde el servidor');
    },
    downloadDatabase() {
        console.log('Para descargar la base de datos, copia el archivo mentoria.db');
    }
};