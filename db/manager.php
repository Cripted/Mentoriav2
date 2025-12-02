<?php
/**
 * manager.php - Gestor de Base de Datos
 * Panel de administración para la base de datos
 */

require_once 'config.php';

// Procesar acciones
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $db = getDB();
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'reset':
                $db->exec("SET FOREIGN_KEY_CHECKS = 0");
                $db->exec("TRUNCATE TABLE sesiones");
                $db->exec("TRUNCATE TABLE emparejamientos");
                $db->exec("TRUNCATE TABLE aprendices");
                $db->exec("TRUNCATE TABLE mentores");
                $db->exec("SET FOREIGN_KEY_CHECKS = 1");
                $message = 'Base de datos limpiada exitosamente';
                $messageType = 'success';
                break;
                
            case 'seed':
                // Insertar datos de ejemplo
                $db->exec("
                    INSERT INTO mentores (nombre, email, carrera, semestre, materias, habilidades, disponibilidad) VALUES
                    ('Carlos Rodríguez', 'carlos@ejemplo.com', 'Ingeniería en Sistemas', 8, '[\"Programación\", \"Bases de Datos\", \"Algoritmos\"]', '[\"Python\", \"JavaScript\", \"SQL\"]', 'Lunes y Miércoles 3-5 PM'),
                    ('Ana García', 'ana@ejemplo.com', 'Ingeniería Industrial', 7, '[\"Matemáticas\", \"Estadística\", \"Procesos\"]', '[\"Excel\", \"Análisis\", \"Liderazgo\"]', 'Martes y Jueves 2-4 PM'),
                    ('Luis Martínez', 'luis@ejemplo.com', 'Administración', 9, '[\"Contabilidad\", \"Finanzas\", \"Marketing\"]', '[\"Excel\", \"PowerPoint\", \"Comunicación\"]', 'Miércoles y Viernes 4-6 PM')
                ");
                
                $db->exec("
                    INSERT INTO aprendices (nombre, email, carrera, semestre, materias, habilidades, disponibilidad) VALUES
                    ('María López', 'maria@ejemplo.com', 'Ingeniería en Sistemas', 3, '[\"Programación\", \"Cálculo\"]', '[\"Python básico\", \"HTML\"]', 'Lunes y Miércoles 3-5 PM'),
                    ('Pedro Sánchez', 'pedro@ejemplo.com', 'Ingeniería Industrial', 2, '[\"Matemáticas\", \"Física\"]', '[\"Excel básico\"]', 'Martes y Jueves 2-4 PM'),
                    ('Laura Torres', 'laura@ejemplo.com', 'Administración', 4, '[\"Contabilidad\", \"Economía\"]', '[\"Office básico\"]', 'Miércoles y Viernes 4-6 PM')
                ");
                
                $message = 'Datos de ejemplo insertados exitosamente';
                $messageType = 'success';
                break;
                
            case 'backup':
                $timestamp = date('Y-m-d_H-i-s');
                $filename = "backup_mentoria_{$timestamp}.sql";
                $filepath = "../backups/{$filename}";
                
                if (!is_dir('../backups')) {
                    mkdir('../backups', 0777, true);
                }
                
                $mysqldump = "C:\\xampp\\mysql\\bin\\mysqldump.exe";
                $command = "\"{$mysqldump}\" -u " . DB_USER . " " . DB_NAME . " > \"{$filepath}\"";
                exec($command, $output, $result);
                
                if ($result === 0) {
                    $message = "Backup creado exitosamente: {$filename}";
                    $messageType = 'success';
                } else {
                    $message = "Error al crear backup";
                    $messageType = 'error';
                }
                break;
        }
    } catch (Exception $e) {
        $message = 'Error: ' . $e->getMessage();
        $messageType = 'error';
    }
}

// Obtener estadísticas
try {
    $db = getDB();
    
    $stats = [
        'mentores' => $db->query("SELECT COUNT(*) FROM mentores")->fetchColumn(),
        'aprendices' => $db->query("SELECT COUNT(*) FROM aprendices")->fetchColumn(),
        'emparejamientos' => $db->query("SELECT COUNT(*) FROM emparejamientos")->fetchColumn(),
        'sesiones' => $db->query("SELECT COUNT(*) FROM sesiones")->fetchColumn(),
    ];
    
    $recentActivity = $db->query("
        SELECT 'mentor' as tipo, nombre, fecha_registro as fecha FROM mentores
        UNION ALL
        SELECT 'aprendiz' as tipo, nombre, fecha_registro as fecha FROM aprendices
        ORDER BY fecha DESC
        LIMIT 10
    ")->fetchAll();
    
} catch (Exception $e) {
    $stats = ['mentores' => 0, 'aprendices' => 0, 'emparejamientos' => 0, 'sesiones' => 0];
    $recentActivity = [];
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestor de Base de Datos - Mentor-Match</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .header h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #6b7280;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border-left: 5px solid;
        }
        
        .stat-card.blue { border-left-color: #3b82f6; }
        .stat-card.green { border-left-color: #10b981; }
        .stat-card.purple { border-left-color: #8b5cf6; }
        .stat-card.orange { border-left-color: #f59e0b; }
        
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .actions-panel {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .actions-panel h2 {
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .action-btn {
            padding: 15px 25px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            color: white;
            font-size: 14px;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        
        .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .message {
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .message.success {
            background: #d1fae5;
            color: #065f46;
            border-left: 5px solid #10b981;
        }
        
        .message.error {
            background: #fee2e2;
            color: #991b1b;
            border-left: 5px solid #ef4444;
        }
        
        .activity-panel {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .activity-panel h2 {
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .activity-item {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-type {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .activity-type.mentor {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .activity-type.aprendiz {
            background: #f3e8ff;
            color: #6b21a8;
        }
        
        .back-link {
            display: inline-block;
            padding: 12px 24px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s;
            margin-bottom: 20px;
        }
        
        .back-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="../index.html" class="back-link">← Volver a la aplicación</a>
        
        <div class="header">
            <h1>🗄️ Gestor de Base de Datos</h1>
            <p>Panel de administración de Mentor-Match</p>
        </div>
        
        <?php if ($message): ?>
            <div class="message <?= $messageType ?>">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>
        
        <div class="stats-grid">
            <div class="stat-card blue">
                <p class="stat-label">Mentores Registrados</p>
                <p class="stat-value"><?= $stats['mentores'] ?></p>
            </div>
            <div class="stat-card green">
                <p class="stat-label">Aprendices Registrados</p>
                <p class="stat-value"><?= $stats['aprendices'] ?></p>
            </div>
            <div class="stat-card purple">
                <p class="stat-label">Emparejamientos Activos</p>
                <p class="stat-value"><?= $stats['emparejamientos'] ?></p>
            </div>
            <div class="stat-card orange">
                <p class="stat-label">Sesiones Programadas</p>
                <p class="stat-value"><?= $stats['sesiones'] ?></p>
            </div>
        </div>
        
        <div class="actions-panel">
            <h2>⚙️ Acciones de Administración</h2>
            <form method="POST" class="actions-grid" onsubmit="return confirm('¿Estás seguro de realizar esta acción?');">
                <button type="submit" name="action" value="reset" class="action-btn btn-danger">
                    🗑️ Limpiar Base de Datos
                </button>
                <button type="submit" name="action" value="seed" class="action-btn btn-success">
                    🌱 Insertar Datos de Ejemplo
                </button>
                <button type="submit" name="action" value="backup" class="action-btn btn-primary">
                    💾 Crear Backup
                </button>
                <a href="test_connection.php" class="action-btn btn-warning" style="display: flex; align-items: center; justify-content: center; text-decoration: none;">
                    🔍 Probar Conexión
                </a>
            </form>
        </div>
        
        <div class="activity-panel">
            <h2>📋 Actividad Reciente</h2>
            <?php if (empty($recentActivity)): ?>
                <p style="color: #6b7280;">No hay actividad reciente</p>
            <?php else: ?>
                <?php foreach ($recentActivity as $activity): ?>
                    <div class="activity-item">
                        <div>
                            <span class="activity-type <?= $activity['tipo'] ?>">
                                <?= ucfirst($activity['tipo']) ?>
                            </span>
                            <strong><?= htmlspecialchars($activity['nombre']) ?></strong>
                        </div>
                        <span style="color: #6b7280; font-size: 14px;">
                            <?= date('d/m/Y H:i', strtotime($activity['fecha'])) ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>