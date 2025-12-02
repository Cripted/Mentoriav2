<?php
/**
 * api.php - API REST para Mentor-Match con MySQL
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db/config.php';

try {
    $db = getDB();
    
    // Obtener método y ruta
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '/';
    $path = trim($path, '/');
    
    // Dividir la ruta en segmentos
    $segments = $path ? explode('/', $path) : [];
    $resource = $segments[0] ?? '';
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;

    // ============================================
    // RUTAS DE LA API
    // ============================================

    // GET / - Verificar conexión
    if ($method === 'GET' && $path === '') {
        echo json_encode([
            'status' => 'ok',
            'message' => 'Mentor-Match API funcionando correctamente',
            'database' => 'MySQL conectado'
        ]);
        exit();
    }

    // ============================================
    // MENTORES
    // ============================================
    if ($resource === 'mentores') {
        
        // GET /mentores - Obtener todos los mentores
        if ($method === 'GET' && !$id) {
            $stmt = $db->query("SELECT * FROM mentores ORDER BY fecha_registro DESC");
            $mentores = $stmt->fetchAll();
            
            // Decodificar JSON de materias y habilidades
            foreach ($mentores as &$mentor) {
                $mentor['materias'] = json_decode($mentor['materias']);
                $mentor['habilidades'] = json_decode($mentor['habilidades']);
            }
            
            echo json_encode($mentores);
            exit();
        }
        
        // GET /mentores/{id} - Obtener un mentor específico
        if ($method === 'GET' && $id) {
            $stmt = $db->prepare("SELECT * FROM mentores WHERE id = ?");
            $stmt->execute([$id]);
            $mentor = $stmt->fetch();
            
            if ($mentor) {
                $mentor['materias'] = json_decode($mentor['materias']);
                $mentor['habilidades'] = json_decode($mentor['habilidades']);
                echo json_encode($mentor);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Mentor no encontrado']);
            }
            exit();
        }
        
        // POST /mentores - Crear nuevo mentor
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $db->prepare("
                INSERT INTO mentores (nombre, email, carrera, semestre, materias, habilidades, disponibilidad)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['nombre'],
                $data['email'],
                $data['carrera'],
                $data['semestre'],
                json_encode($data['materias']),
                json_encode($data['habilidades']),
                $data['disponibilidad']
            ]);
            
            echo json_encode([
                'id' => $db->lastInsertId(),
                'message' => 'Mentor creado exitosamente'
            ]);
            exit();
        }
    }

    // ============================================
    // APRENDICES
    // ============================================
    if ($resource === 'aprendices') {
        
        // GET /aprendices - Obtener todos los aprendices
        if ($method === 'GET' && !$id) {
            $stmt = $db->query("SELECT * FROM aprendices ORDER BY fecha_registro DESC");
            $aprendices = $stmt->fetchAll();
            
            foreach ($aprendices as &$aprendiz) {
                $aprendiz['materias'] = json_decode($aprendiz['materias']);
                $aprendiz['habilidades'] = json_decode($aprendiz['habilidades']);
            }
            
            echo json_encode($aprendices);
            exit();
        }
        
        // GET /aprendices/{id} - Obtener un aprendiz específico
        if ($method === 'GET' && $id) {
            // Verificar si la acción es "tiene-mentor"
            if ($action === 'tiene-mentor') {
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM emparejamientos WHERE aprendiz_id = ? AND estado = 'activo'");
                $stmt->execute([$id]);
                $result = $stmt->fetch();
                
                echo json_encode(['tieneMentor' => $result['count'] > 0]);
                exit();
            }
            
            $stmt = $db->prepare("SELECT * FROM aprendices WHERE id = ?");
            $stmt->execute([$id]);
            $aprendiz = $stmt->fetch();
            
            if ($aprendiz) {
                $aprendiz['materias'] = json_decode($aprendiz['materias']);
                $aprendiz['habilidades'] = json_decode($aprendiz['habilidades']);
                echo json_encode($aprendiz);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Aprendiz no encontrado']);
            }
            exit();
        }
        
        // POST /aprendices - Crear nuevo aprendiz
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $db->prepare("
                INSERT INTO aprendices (nombre, email, carrera, semestre, materias, habilidades, disponibilidad)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['nombre'],
                $data['email'],
                $data['carrera'],
                $data['semestre'],
                json_encode($data['materias']),
                json_encode($data['habilidades']),
                $data['disponibilidad']
            ]);
            
            echo json_encode([
                'id' => $db->lastInsertId(),
                'message' => 'Aprendiz creado exitosamente'
            ]);
            exit();
        }
    }

    // ============================================
    // EMPAREJAMIENTOS
    // ============================================
    if ($resource === 'emparejamientos') {
        
        // GET /emparejamientos - Obtener todos los emparejamientos
        if ($method === 'GET' && !$id) {
            $stmt = $db->query("SELECT * FROM emparejamientos WHERE estado = 'activo' ORDER BY fecha_creacion DESC");
            $emparejamientos = $stmt->fetchAll();
            
            echo json_encode($emparejamientos);
            exit();
        }
        
        // POST /emparejamientos - Crear nuevo emparejamiento
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verificar que el aprendiz no tenga ya un mentor
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM emparejamientos WHERE aprendiz_id = ? AND estado = 'activo'");
            $stmt->execute([$data['aprendizId']]);
            $existe = $stmt->fetch();
            
            if ($existe['count'] > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Este aprendiz ya tiene un mentor asignado']);
                exit();
            }
            
            $stmt = $db->prepare("
                INSERT INTO emparejamientos (mentor_id, aprendiz_id)
                VALUES (?, ?)
            ");
            
            $stmt->execute([
                $data['mentorId'],
                $data['aprendizId']
            ]);
            
            echo json_encode([
                'id' => $db->lastInsertId(),
                'message' => 'Emparejamiento creado exitosamente'
            ]);
            exit();
        }
    }

    // ============================================
    // SESIONES
    // ============================================
    if ($resource === 'sesiones') {
        
        // GET /sesiones - Obtener todas las sesiones
        if ($method === 'GET' && !$id) {
            // Verificar si es una consulta por emparejamiento
            if (isset($segments[1]) && $segments[0] === 'sesiones' && $segments[1] === 'emparejamiento' && isset($segments[2])) {
                $empId = $segments[2];
                $stmt = $db->prepare("SELECT * FROM sesiones WHERE emparejamiento_id = ? ORDER BY fecha DESC, hora DESC");
                $stmt->execute([$empId]);
            } else {
                $stmt = $db->query("SELECT * FROM sesiones ORDER BY fecha DESC, hora DESC");
            }
            
            $sesiones = $stmt->fetchAll();
            echo json_encode($sesiones);
            exit();
        }
        
        // POST /sesiones - Crear nueva sesión
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $db->prepare("
                INSERT INTO sesiones (emparejamiento_id, fecha, hora, tema, modalidad, estado)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['emparejamientoId'],
                $data['fecha'],
                $data['hora'],
                $data['tema'],
                $data['modalidad'],
                $data['estado'] ?? 'programada'
            ]);
            
            echo json_encode([
                'id' => $db->lastInsertId(),
                'message' => 'Sesión creada exitosamente'
            ]);
            exit();
        }
        
        // PUT /sesiones/{id} - Actualizar sesión
        if ($method === 'PUT' && $id) {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            if (isset($data['estado'])) {
                $updates[] = "estado = ?";
                $params[] = $data['estado'];
            }
            if (isset($data['bitacora'])) {
                $updates[] = "bitacora = ?";
                $params[] = $data['bitacora'];
            }
            if (isset($data['fechaCompletada'])) {
                $updates[] = "fecha_completada = ?";
                $params[] = $data['fechaCompletada'];
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No hay datos para actualizar']);
                exit();
            }
            
            $params[] = $id;
            $sql = "UPDATE sesiones SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['message' => 'Sesión actualizada exitosamente']);
            exit();
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================
    
    // DELETE /clear-all - Limpiar todas las tablas
    if ($method === 'DELETE' && $resource === 'clear-all') {
        $db->exec("SET FOREIGN_KEY_CHECKS = 0");
        $db->exec("TRUNCATE TABLE sesiones");
        $db->exec("TRUNCATE TABLE emparejamientos");
        $db->exec("TRUNCATE TABLE aprendices");
        $db->exec("TRUNCATE TABLE mentores");
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        echo json_encode(['message' => 'Todas las tablas han sido limpiadas']);
        exit();
    }
    
    // GET /export - Exportar todos los datos
    if ($method === 'GET' && $resource === 'export') {
        $stmt = $db->query("SELECT * FROM mentores");
        $mentores = $stmt->fetchAll();
        
        $stmt = $db->query("SELECT * FROM aprendices");
        $aprendices = $stmt->fetchAll();
        
        $stmt = $db->query("SELECT * FROM emparejamientos");
        $emparejamientos = $stmt->fetchAll();
        
        $stmt = $db->query("SELECT * FROM sesiones");
        $sesiones = $stmt->fetchAll();
        
        echo json_encode([
            'mentores' => $mentores,
            'aprendices' => $aprendices,
            'emparejamientos' => $emparejamientos,
            'sesiones' => $sesiones
        ]);
        exit();
    }

    // Si llegamos aquí, la ruta no existe
    http_response_code(404);
    echo json_encode(['error' => 'Ruta no encontrada']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de base de datos',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error del servidor',
        'message' => $e->getMessage()
    ]);
}