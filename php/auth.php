<?php
/**
 * auth.php - Sistema de autenticación completo (CORREGIDO)
 * Maneja login, registro, verificación de sesiones y gestión de perfiles
 */

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db/config.php';

$action = $_GET['action'] ?? '';

// Log para debugging
error_log("🔵 AUTH.PHP - Acción: " . $action);

try {
    $db = getDB();
    
    switch ($action) {
        case 'login':
            handleLogin($db);
            break;
            
        case 'register':
            handleRegister($db);
            break;
            
        case 'check':
            handleCheckSession($db);
            break;
            
        case 'logout':
            handleLogout();
            break;
            
        case 'completar-perfil-aprendiz':
            handleCompletarPerfilAprendiz($db);
            break;
            
        case 'completar-perfil-mentor':
            handleCompletarPerfilMentor($db);
            break;
            
        case 'get-mentor-data':
            getMentorData($db);
            break;
            
        case 'get-aprendiz-data':
            getAprendizData($db);
            break;
            
        case 'confirmar-sesion':
            confirmarSesion($db);
            break;
            
        case 'rechazar-sesion':
            rechazarSesion($db);
            break;
            
        case 'completar-sesion':
            completarSesion($db);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Acción no válida: ' . $action]);
    }
} catch (Exception $e) {
    error_log("❌ Error en auth.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}

// ==================== FUNCIONES DE AUTENTICACIÓN ====================

function handleLogin($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email y contraseña son requeridos']);
        return;
    }
    
    $email = trim($data['email']);
    $password = $data['password'];
    
    error_log("🔵 Login attempt: " . $email);
    
    // Buscar usuario
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales incorrectas']);
        return;
    }
    
    // Verificar contraseña
    if (!password_verify($password, $usuario['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales incorrectas']);
        return;
    }
    
    // Crear sesión
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['email'] = $usuario['email'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['nombre'] = $usuario['nombre'];
    
    error_log("✅ Login exitoso: " . $usuario['nombre'] . " (" . $usuario['rol'] . ")");
    
    // Obtener datos adicionales según el rol
    $datosAdicionales = obtenerDatosAdicionales($db, $usuario);
    
    echo json_encode([
        'success' => true,
        'usuario' => [
            'id' => $usuario['id'],
            'nombre' => $usuario['nombre'],
            'email' => $usuario['email'],
            'rol' => $usuario['rol']
        ],
        'datos_adicionales' => $datosAdicionales
    ]);
}

function handleRegister($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Todos los campos son requeridos']);
        return;
    }
    
    $nombre = trim($data['nombre']);
    $email = trim($data['email']);
    $password = $data['password'];
    $rol = $data['rol'] ?? 'aprendiz';
    
    error_log("🔵 Registro: " . $email . " como " . $rol);
    
    // Validar que el rol sea válido
    if (!in_array($rol, ['aprendiz', 'mentor'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Rol no válido']);
        return;
    }
    
    // Validaciones
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email no válido']);
        return;
    }
    
    // Verificar si el email ya existe
    $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Este email ya está registrado']);
        return;
    }
    
    // Crear usuario
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO usuarios (email, password, rol, nombre) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $passwordHash, $rol, $nombre]);
    
    error_log("✅ Usuario registrado: " . $nombre);
    
    echo json_encode([
        'success' => true,
        'message' => 'Usuario registrado exitosamente',
        'rol' => $rol
    ]);
}

function handleCheckSession($db) {
    if (!isset($_SESSION['usuario_id'])) {
        error_log("❌ No hay sesión activa");
        http_response_code(401);
        echo json_encode(['error' => 'No hay sesión activa']);
        return;
    }
    
    error_log("🔵 Verificando sesión para usuario_id: " . $_SESSION['usuario_id']);
    
    // Obtener datos del usuario
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->execute([$_SESSION['usuario_id']]);
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
        session_destroy();
        http_response_code(401);
        echo json_encode(['error' => 'Usuario no encontrado']);
        return;
    }
    
    error_log("✅ Usuario encontrado: " . $usuario['nombre'] . " (" . $usuario['rol'] . ")");
    
    // Obtener datos adicionales según el rol
    $datosAdicionales = obtenerDatosAdicionales($db, $usuario);
    
    echo json_encode([
        'success' => true,
        'usuario' => [
            'id' => $usuario['id'],
            'nombre' => $usuario['nombre'],
            'email' => $usuario['email'],
            'rol' => $usuario['rol']
        ],
        'datos_adicionales' => $datosAdicionales
    ]);
}

function obtenerDatosAdicionales($db, $usuario) {
    $datosAdicionales = null;
    
    if ($usuario['rol'] === 'mentor') {
        error_log("🔍 Buscando perfil de mentor para usuario_id: " . $usuario['id']);
        $stmt = $db->prepare("SELECT * FROM mentores WHERE usuario_id = ?");
        $stmt->execute([$usuario['id']]);
        $mentor = $stmt->fetch();
        if ($mentor) {
            error_log("✅ Perfil de mentor encontrado: ID " . $mentor['id']);
            $mentor['materias'] = json_decode($mentor['materias']);
            $mentor['habilidades'] = json_decode($mentor['habilidades']);
            $datosAdicionales = $mentor;
        } else {
            error_log("⚠️ No se encontró perfil de mentor");
        }
    } elseif ($usuario['rol'] === 'aprendiz') {
        error_log("🔍 Buscando perfil de aprendiz para usuario_id: " . $usuario['id']);
        $stmt = $db->prepare("SELECT * FROM aprendices WHERE usuario_id = ?");
        $stmt->execute([$usuario['id']]);
        $aprendiz = $stmt->fetch();
        if ($aprendiz) {
            error_log("✅ Perfil de aprendiz encontrado: ID " . $aprendiz['id']);
            $aprendiz['materias'] = json_decode($aprendiz['materias']);
            $aprendiz['habilidades'] = json_decode($aprendiz['habilidades']);
            $datosAdicionales = $aprendiz;
        } else {
            error_log("⚠️ No se encontró perfil de aprendiz");
        }
    }
    
    return $datosAdicionales;
}

function handleLogout() {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
}

// ==================== FUNCIONES DE PERFIL ====================

function handleCompletarPerfilAprendiz($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'aprendiz') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = $_SESSION['nombre'];
    $email = $_SESSION['email'];
    $carrera = $data['carrera'];
    $semestre = intval($data['semestre']);
    $materias = json_encode($data['materias']);
    $habilidades = json_encode($data['habilidades']);
    $disponibilidad = $data['disponibilidad'];
    $usuarioId = $_SESSION['usuario_id'];
    
    error_log("🔵 Completando perfil de aprendiz para usuario_id: " . $usuarioId);
    
    $stmt = $db->prepare("
        INSERT INTO aprendices (nombre, email, carrera, semestre, materias, habilidades, disponibilidad, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $nombre,
        $email,
        $carrera,
        $semestre,
        $materias,
        $habilidades,
        $disponibilidad,
        $usuarioId
    ]);
    
    error_log("✅ Perfil de aprendiz completado");
    
    echo json_encode(['success' => true, 'message' => 'Perfil completado']);
}

function handleCompletarPerfilMentor($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'mentor') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = $_SESSION['nombre'];
    $email = $_SESSION['email'];
    $carrera = $data['carrera'];
    $semestre = intval($data['semestre']);
    $materias = json_encode($data['materias']);
    $habilidades = json_encode($data['habilidades']);
    $disponibilidad = $data['disponibilidad'];
    $usuarioId = $_SESSION['usuario_id'];
    
    error_log("🔵 Completando perfil de mentor para usuario_id: " . $usuarioId);
    
    $stmt = $db->prepare("
        INSERT INTO mentores (nombre, email, carrera, semestre, materias, habilidades, disponibilidad, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $nombre,
        $email,
        $carrera,
        $semestre,
        $materias,
        $habilidades,
        $disponibilidad,
        $usuarioId
    ]);
    
    error_log("✅ Perfil de mentor completado");
    
    echo json_encode(['success' => true, 'message' => 'Perfil completado']);
}

// ==================== FUNCIONES PARA MENTOR ====================

function getMentorData($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'mentor') {
        error_log("❌ No autorizado - usuario_id: " . ($_SESSION['usuario_id'] ?? 'null') . ", rol: " . ($_SESSION['rol'] ?? 'null'));
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    error_log("🔵 Obteniendo datos de mentor para usuario_id: " . $_SESSION['usuario_id']);
    
    // Obtener datos del mentor
    $stmt = $db->prepare("SELECT * FROM mentores WHERE usuario_id = ?");
    $stmt->execute([$_SESSION['usuario_id']]);
    $mentor = $stmt->fetch();
    
    if (!$mentor) {
        error_log("❌ Perfil de mentor no encontrado");
        http_response_code(404);
        echo json_encode(['error' => 'Perfil de mentor no encontrado']);
        return;
    }
    
    error_log("✅ Mentor encontrado: ID " . $mentor['id'] . " - " . $mentor['nombre']);
    
    // Obtener emparejamientos
    $stmt = $db->prepare("SELECT * FROM emparejamientos WHERE mentor_id = ? AND estado = 'activo'");
    $stmt->execute([$mentor['id']]);
    $emparejamientos = $stmt->fetchAll();
    
    error_log("📊 Emparejamientos encontrados: " . count($emparejamientos));
    
    // Obtener sesiones CON nombres de aprendices
    $sesiones = [];
    $aprendices = [];
    
    foreach ($emparejamientos as $emp) {
        // Obtener aprendiz
        $stmt = $db->prepare("SELECT * FROM aprendices WHERE id = ?");
        $stmt->execute([$emp['aprendiz_id']]);
        $aprendiz = $stmt->fetch();
        if ($aprendiz) {
            $aprendices[] = $aprendiz;
        }
        
        // Obtener sesiones con nombre del aprendiz
        $stmt = $db->prepare("
            SELECT s.*, a.nombre as aprendiz_nombre 
            FROM sesiones s 
            JOIN emparejamientos e ON s.emparejamiento_id = e.id
            JOIN aprendices a ON e.aprendiz_id = a.id
            WHERE s.emparejamiento_id = ?
            ORDER BY s.fecha DESC, s.hora DESC
        ");
        $stmt->execute([$emp['id']]);
        $sesionesPorEmp = $stmt->fetchAll();
        $sesiones = array_merge($sesiones, $sesionesPorEmp);
    }
    
    error_log("📅 Sesiones encontradas: " . count($sesiones));
    error_log("👥 Aprendices encontrados: " . count($aprendices));
    
    $response = [
        'success' => true,
        'mentor' => $mentor,
        'emparejamientos' => $emparejamientos,
        'sesiones' => $sesiones,
        'aprendices' => $aprendices
    ];
    
    error_log("✅ Respuesta preparada correctamente");
    error_log("📦 Datos: " . json_encode($response));
    
    echo json_encode($response);
}

function confirmarSesion($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'mentor') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $sesionId = $data['sesionId'] ?? null;
    
    if (!$sesionId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de sesión requerido']);
        return;
    }
    
    error_log("🔵 Confirmando sesión: " . $sesionId);
    
    // Actualizar estado a 'confirmada' para diferenciar de 'programada'
    $stmt = $db->prepare("UPDATE sesiones SET estado = 'confirmada' WHERE id = ?");
    $stmt->execute([$sesionId]);
    
    error_log("✅ Sesión confirmada");
    
    echo json_encode(['success' => true, 'message' => 'Sesión confirmada']);
}

function rechazarSesion($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'mentor') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $sesionId = $data['sesionId'] ?? null;
    $motivo = $data['motivo'] ?? 'No especificado';
    
    if (!$sesionId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de sesión requerido']);
        return;
    }
    
    error_log("🔵 Rechazando sesión: " . $sesionId);
    
    $stmt = $db->prepare("UPDATE sesiones SET estado = 'cancelada', bitacora = ? WHERE id = ?");
    $stmt->execute(['Rechazada por el mentor. Motivo: ' . $motivo, $sesionId]);
    
    error_log("✅ Sesión rechazada");
    
    echo json_encode(['success' => true, 'message' => 'Sesión rechazada']);
}

function completarSesion($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'mentor') {
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $sesionId = $data['sesionId'] ?? null;
    $bitacora = $data['bitacora'] ?? '';
    
    if (!$sesionId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de sesión requerido']);
        return;
    }
    
    error_log("🔵 Completando sesión: " . $sesionId);
    
    $stmt = $db->prepare("UPDATE sesiones SET estado = 'completada', bitacora = ?, fecha_completada = NOW() WHERE id = ?");
    $stmt->execute([$bitacora, $sesionId]);
    
    error_log("✅ Sesión completada");
    
    echo json_encode(['success' => true, 'message' => 'Sesión completada']);
}

// ==================== FUNCIONES PARA APRENDIZ ====================

function getAprendizData($db) {
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'aprendiz') {
        error_log("❌ No autorizado");
        http_response_code(403);
        echo json_encode(['error' => 'No autorizado']);
        return;
    }
    
    error_log("🔵 Obteniendo datos de aprendiz para usuario_id: " . $_SESSION['usuario_id']);
    
    // Obtener datos del aprendiz
    $stmt = $db->prepare("SELECT * FROM aprendices WHERE usuario_id = ?");
    $stmt->execute([$_SESSION['usuario_id']]);
    $aprendiz = $stmt->fetch();
    
    if (!$aprendiz) {
        error_log("❌ Perfil de aprendiz no encontrado");
        http_response_code(404);
        echo json_encode(['error' => 'Perfil de aprendiz no encontrado']);
        return;
    }
    
    // IMPORTANTE: Decodificar JSON para que JavaScript pueda trabajar con arrays
    $aprendiz['materias'] = json_decode($aprendiz['materias']);
    $aprendiz['habilidades'] = json_decode($aprendiz['habilidades']);
    
    error_log("✅ Aprendiz encontrado: ID " . $aprendiz['id']);
    
    // Obtener emparejamiento
    $stmt = $db->prepare("SELECT * FROM emparejamientos WHERE aprendiz_id = ? AND estado = 'activo'");
    $stmt->execute([$aprendiz['id']]);
    $emparejamiento = $stmt->fetch();
    
    $mentor = null;
    $sesiones = [];
    
    if ($emparejamiento) {
        error_log("✅ Emparejamiento encontrado");
        
        // Obtener mentor
        $stmt = $db->prepare("SELECT * FROM mentores WHERE id = ?");
        $stmt->execute([$emparejamiento['mentor_id']]);
        $mentor = $stmt->fetch();
        
        if ($mentor) {
            // Decodificar JSON del mentor también
            $mentor['materias'] = json_decode($mentor['materias']);
            $mentor['habilidades'] = json_decode($mentor['habilidades']);
            error_log("✅ Mentor encontrado: " . $mentor['nombre']);
        }
        
        // Obtener sesiones
        $stmt = $db->prepare("SELECT * FROM sesiones WHERE emparejamiento_id = ? ORDER BY fecha DESC, hora DESC");
        $stmt->execute([$emparejamiento['id']]);
        $sesiones = $stmt->fetchAll();
        
        error_log("📅 Sesiones encontradas: " . count($sesiones));
    } else {
        error_log("⚠️ No hay emparejamiento activo");
    }
    
    echo json_encode([
        'success' => true,
        'aprendiz' => $aprendiz,
        'emparejamiento' => $emparejamiento,
        'mentor' => $mentor,
        'sesiones' => $sesiones
    ]);
}
?>