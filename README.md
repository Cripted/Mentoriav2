# Mentoriav2
# 📚 Mentor-Match - Instalación con XAMPP y MySQL

Guía completa para configurar el sistema de gestión de mentorías con base de datos MySQL.

---

## 📋 Requisitos Previos

- **XAMPP** instalado (descarga desde https://www.apachefriends.org/)
- Navegador web moderno (Chrome, Firefox, Edge)
- Editor de texto (opcional, para ver el código)

---

## 🚀 Instalación Paso a Paso

### **Paso 1: Estructura de Archivos**

Crea la siguiente estructura en `C:\xampp\htdocs\Mentoriav2\`:

```
Mentoriav2/
├── index.html
├── api.php
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── db/
    ├── config.php
    ├── api.js
    └── test_connection.php
```

### **Paso 2: Iniciar XAMPP**

1. Abre el **Panel de Control de XAMPP**
2. Inicia los siguientes servicios:
   - ✅ **Apache** (click en "Start")
   - ✅ **MySQL** (click en "Start")

![XAMPP Panel](https://via.placeholder.com/400x200/10b981/ffffff?text=Apache+y+MySQL+RUNNING)

**Nota:** Los botones deben mostrar "Stop" cuando estén corriendo correctamente.

---

### **Paso 3: Crear la Base de Datos**

#### **Opción A: Usando phpMyAdmin (Recomendado)**

1. Abre tu navegador y ve a: `http://localhost/phpmyadmin`
2. Click en la pestaña **"SQL"** en el menú superior
3. Copia y pega el contenido completo del archivo `mentoria_database.sql`
4. Click en el botón **"Continuar"** o **"Go"**
5. Deberías ver el mensaje: ✅ "Query ejecutado exitosamente"

#### **Opción B: Línea de comandos (Avanzado)**

```bash
# Navegar al directorio de MySQL
cd C:\xampp\mysql\bin

# Ejecutar el script SQL
mysql -u root < C:\xampp\htdocs\Mentoriav2\mentoria_database.sql
```

---

### **Paso 4: Verificar la Instalación**

#### **Test de Conexión PHP**

Abre en tu navegador:
```
http://localhost/Mentoriav2/db/test_connection.php
```

Deberías ver:
- ✅ Conexión exitosa a MySQL
- 📊 Lista de tablas (mentores, aprendices, emparejamientos, sesiones)
- 👥 Datos de ejemplo cargados

#### **Test de API**

Abre en tu navegador:
```
http://localhost/Mentoriav2/api.php
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Mentor-Match API funcionando correctamente",
  "database": "MySQL conectado"
}
```

---

### **Paso 5: Abrir la Aplicación**

Abre en tu navegador:
```
http://localhost/Mentoriav2/
```

¡Listo! 🎉 La aplicación debería estar funcionando.

---

## 🔧 Configuración de la Base de Datos

### **Archivo: `db/config.php`**

Si necesitas cambiar las credenciales de MySQL:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'mentoria_db');
define('DB_USER', 'root');
define('DB_PASS', ''); // Cambiar si tienes contraseña
```

**Nota:** Por defecto, XAMPP viene sin contraseña para el usuario `root`.

---

## 📊 Estructura de la Base de Datos

### **Tabla: mentores**
```sql
- id (INT, PK, AUTO_INCREMENT)
- nombre (VARCHAR)
- email (VARCHAR, UNIQUE)
- carrera (VARCHAR)
- semestre (INT)
- materias (TEXT, JSON)
- habilidades (TEXT, JSON)
- disponibilidad (VARCHAR)
- fecha_registro (TIMESTAMP)
```

### **Tabla: aprendices**
```sql
- id (INT, PK, AUTO_INCREMENT)
- nombre (VARCHAR)
- email (VARCHAR, UNIQUE)
- carrera (VARCHAR)
- semestre (INT)
- materias (TEXT, JSON)
- habilidades (TEXT, JSON)
- disponibilidad (VARCHAR)
- fecha_registro (TIMESTAMP)
```

### **Tabla: emparejamientos**
```sql
- id (INT, PK, AUTO_INCREMENT)
- mentor_id (INT, FK)
- aprendiz_id (INT, FK)
- fecha_creacion (TIMESTAMP)
- estado (VARCHAR)
```

### **Tabla: sesiones**
```sql
- id (INT, PK, AUTO_INCREMENT)
- emparejamiento_id (INT, FK)
- fecha (DATE)
- hora (TIME)
- tema (VARCHAR)
- modalidad (ENUM: presencial/virtual)
- estado (ENUM: programada/completada/cancelada)
- bitacora (TEXT)
- fecha_completada (TIMESTAMP)
- fecha_creacion (TIMESTAMP)
```

---

## 🐛 Solución de Problemas

### **❌ Error: "No se pudo conectar con el servidor"**

**Soluciones:**
1. Verifica que Apache esté corriendo en XAMPP
2. Asegúrate de que la ruta sea correcta: `http://localhost/Mentoriav2/`
3. Revisa que todos los archivos estén en la carpeta correcta

### **❌ Error: "Error de conexión a la base de datos"**

**Soluciones:**
1. Verifica que MySQL esté corriendo en XAMPP
2. Asegúrate de haber ejecutado el script SQL en phpMyAdmin
3. Revisa las credenciales en `db/config.php`
4. Verifica que la base de datos `mentoria_db` exista

### **❌ Error: "Tabla no encontrada"**

**Solución:**
1. Ve a phpMyAdmin: `http://localhost/phpmyadmin`
2. Selecciona la base de datos `mentoria_db`
3. Ejecuta nuevamente el script `mentoria_database.sql`

### **❌ Consola del navegador muestra errores 404**

**Solución:**
1. Abre las herramientas de desarrollo (F12)
2. Ve a la pestaña "Console"
3. Verifica que las rutas de los archivos JS y CSS sean correctas
4. Asegúrate de que los archivos existan en las carpetas `js/` y `css/`

---

## 📱 Uso de la Aplicación

### **1. Dashboard**
- Ver estadísticas generales
- Próximas sesiones
- Carreras con más mentorías

### **2. Registro**
- Registrar nuevos mentores
- Registrar nuevos aprendices
- Gestión de perfiles

### **3. Emparejamiento**
- Seleccionar aprendiz
- Ver mentores sugeridos con % de compatibilidad
- Asignar mentor al aprendiz

### **4. Sesiones**
- Programar nuevas sesiones
- Ver sesiones programadas
- Marcar sesiones como completadas
- Agregar bitácora de sesión

### **5. Reportes**
- Estadísticas de sesiones
- Emparejamientos activos
- Mentores más activos
- Tasa de completación

---

## 🔐 Seguridad

### **Recomendaciones para producción:**

1. **Cambiar credenciales de MySQL:**
```php
// En db/config.php
define('DB_USER', 'mentor_user');
define('DB_PASS', 'tu_contraseña_segura');
```

2. **Crear usuario específico en MySQL:**
```sql
CREATE USER 'mentor_user'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON mentoria_db.* TO 'mentor_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Validar entrada de usuarios** (ya implementado en `api.php`)
4. **Usar HTTPS** en producción
5. **Implementar autenticación de usuarios**

---

## 🗄️ Respaldo de la Base de Datos

### **Exportar datos:**

1. Ve a phpMyAdmin
2. Selecciona la base de datos `mentoria_db`
3. Click en "Exportar"
4. Selecciona formato "SQL"
5. Click en "Continuar"

### **Importar datos:**

1. Ve a phpMyAdmin
2. Selecciona la base de datos `mentoria_db`
3. Click en "Importar"
4. Selecciona tu archivo .sql
5. Click en "Continuar"

---

## 📞 Soporte

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Verifica los logs de Apache en: `C:\xampp\apache\logs\error.log`
3. Ejecuta el test de conexión: `http://localhost/Mentoriav2/db/test_connection.php`

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso educativo.

---

**¡Disfruta usando Mentor-Match! 🎓✨**