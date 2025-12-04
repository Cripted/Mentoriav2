<?php
session_start();
require_once '../db/config.php';

// Verificar que sea admin
if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'admin') {
    header('Location: ../login.html');
    exit();
}

$db = getDB();
$mensaje = '';
$error = '';
$tipo = $_GET['tipo'] ?? 'mentor'; // mentor o aprendiz

// ----- Crear mentor/aprendiz -----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['crear'])) {
    $nombre = trim($_POST['nombre']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $carrera = $_POST['carrera'];
    $semestre = intval($_POST['semestre']);
    $materias = $_POST['materias'];
    $habilidades = $_POST['habilidades'];
    $disponibilidad = $_POST['disponibilidad'];
    
    try {
        // 1. Crear usuario
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO usuarios (email, password, rol, nombre) VALUES (?, ?, ?, ?)");
        $stmt->execute([$email, $passwordHash, $tipo, $nombre]);
        $usuarioId = $db->lastInsertId();
        
        // 2. Crear perfil
        $tabla = $tipo === 'mentor' ? 'mentores' : 'aprendices';
        $stmt = $db->prepare("
            INSERT INTO $tabla (nombre, email, carrera, semestre, materias, habilidades, disponibilidad, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $nombre, 
            $email, 
            $carrera, 
            $semestre, 
            json_encode(array_map('trim', explode(',', $materias))),
            json_encode(array_map('trim', explode(',', $habilidades))),
            $disponibilidad,
            $usuarioId
        ]);
        
        $mensaje = ucfirst($tipo) . " creado correctamente.";
    } catch (PDOException $e) {
        $error = "Error al crear: " . $e->getMessage();
    }
}

// ----- Actualizar mentor/aprendiz -----
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['actualizar'])) {
    $id = $_POST['id'];
    $nombre = trim($_POST['nombre']);
    $email = trim($_POST['email']);
    $carrera = $_POST['carrera'];
    $semestre = intval($_POST['semestre']);
    $materias = $_POST['materias'];
    $habilidades = $_POST['habilidades'];
    $disponibilidad = $_POST['disponibilidad'];
    
    try {
        $tabla = $tipo === 'mentor' ? 'mentores' : 'aprendices';
        
        // Actualizar perfil
        $stmt = $db->prepare("
            UPDATE $tabla 
            SET nombre=?, email=?, carrera=?, semestre=?, materias=?, habilidades=?, disponibilidad=?
            WHERE id=?
        ");
        $stmt->execute([
            $nombre, 
            $email, 
            $carrera, 
            $semestre,
            json_encode(array_map('trim', explode(',', $materias))),
            json_encode(array_map('trim', explode(',', $habilidades))),
            $disponibilidad,
            $id
        ]);
        
        // Actualizar usuario vinculado
        $stmt = $db->prepare("SELECT usuario_id FROM $tabla WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        if ($result && $result['usuario_id']) {
            $stmt = $db->prepare("UPDATE usuarios SET email=?, nombre=? WHERE id=?");
            $stmt->execute([$email, $nombre, $result['usuario_id']]);
        }
        
        // Si se proporciona nueva contraseña
        if (!empty($_POST['password'])) {
            $passwordHash = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE usuarios SET password=? WHERE id=?");
            $stmt->execute([$passwordHash, $result['usuario_id']]);
        }
        
        $mensaje = ucfirst($tipo) . " actualizado correctamente.";
    } catch (PDOException $e) {
        $error = "Error al actualizar: " . $e->getMessage();
    }
}

// ----- Eliminar mentor/aprendiz -----
if (isset($_GET['eliminar'])) {
    $id = $_GET['eliminar'];
    $tipoEliminar = $_GET['tipo'];
    
    try {
        $tabla = $tipoEliminar === 'mentor' ? 'mentores' : 'aprendices';
        
        // Obtener usuario_id antes de eliminar
        $stmt = $db->prepare("SELECT usuario_id FROM $tabla WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        // Eliminar perfil
        $stmt = $db->prepare("DELETE FROM $tabla WHERE id=?");
        $stmt->execute([$id]);
        
        // Eliminar usuario si existe
        if ($result && $result['usuario_id']) {
            $stmt = $db->prepare("DELETE FROM usuarios WHERE id=?");
            $stmt->execute([$result['usuario_id']]);
        }
        
        $mensaje = ucfirst($tipoEliminar) . " eliminado correctamente.";
    } catch (PDOException $e) {
        $error = "Error al eliminar: " . $e->getMessage();
    }
}

// ----- Leer registros -----
$tabla = $tipo === 'mentor' ? 'mentores' : 'aprendices';
$registros = $db->query("SELECT * FROM $tabla ORDER BY nombre");

// ----- Obtener registro a editar -----
$registroEditar = null;
if (isset($_GET['editar'])) {
    $idEditar = $_GET['editar'];
    $tipoEditar = $_GET['tipo'];
    $tablaEditar = $tipoEditar === 'mentor' ? 'mentores' : 'aprendices';
    $stmt = $db->prepare("SELECT * FROM $tablaEditar WHERE id = ?");
    $stmt->execute([$idEditar]);
    $registroEditar = $stmt->fetch();
    if ($registroEditar) {
        $registroEditar['materias'] = implode(', ', json_decode($registroEditar['materias']));
        $registroEditar['habilidades'] = implode(', ', json_decode($registroEditar['habilidades']));
    }
}

// Obtener estadísticas
$stmt = $db->query("SELECT COUNT(*) as total FROM mentores");
$totalMentores = $stmt->fetch()['total'];

$stmt = $db->query("SELECT COUNT(*) as total FROM aprendices");
$totalAprendices = $stmt->fetch()['total'];

$stmt = $db->query("SELECT COUNT(*) as total FROM emparejamientos WHERE estado = 'activo'");
$totalEmparejamientos = $stmt->fetch()['total'];
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>CRUD - Gestión de Mentorías</title>
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
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .header {
        background: white;
        padding: 30px;
        border-radius: 15px;
        margin-bottom: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header h1 {
        color: #1f2937;
        font-size: 2rem;
    }
    
    .back-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s;
    }
    
    .back-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
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
    
    .tabs {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .tab-btn {
        flex: 1;
        padding: 15px;
        background: white;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .tab-btn:hover {
        transform: translateY(-2px);
    }
    
    .tab-btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
        color: #1f2937;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 3px solid #667eea;
    }
    
    .alert {
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
        font-weight: 500;
    }
    
    .alert.success {
        background: #d1fae5;
        color: #065f46;
        border-left: 4px solid #10b981;
    }
    
    .alert.error {
        background: #fee2e2;
        color: #991b1b;
        border-left: 4px solid #ef4444;
    }
    
    form {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        background: #f9fafb;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 30px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
    }
    
    .form-group.full {
        grid-column: 1 / -1;
    }
    
    label {
        font-weight: 600;
        margin-bottom: 8px;
        color: #374151;
    }
    
    input, select, textarea {
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s;
    }
    
    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    textarea {
        min-height: 60px;
        resize: vertical;
    }
    
    .form-actions {
        grid-column: 1 / -1;
        display: flex;
        gap: 15px;
    }
    
    button {
        padding: 12px 30px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 14px;
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
        background: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover {
        background: #4b5563;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    
    thead {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    th, td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
    }
    
    tbody tr {
        transition: all 0.3s;
    }
    
    tbody tr:hover {
        background: #f9fafb;
    }
    
    .actions {
        display: flex;
        gap: 10px;
    }
    
    .btn-edit {
        background: #3b82f6;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
    }
    
    .btn-delete {
        background: #ef4444;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
    }
    
    .btn-edit:hover {
        background: #2563eb;
    }
    
    .btn-delete:hover {
        background: #dc2626;
    }
    
    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }
    
    .tag {
        background: #dbeafe;
        color: #1e40af;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px;
        color: #6b7280;
    }
  </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>⚙️ CRUD - Gestión de Mentorías</h1>
        <a href="../dashboard.html" class="back-btn">← Volver al Sistema</a>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card blue">
            <p class="stat-label">Total Mentores</p>
            <p class="stat-value"><?= $totalMentores ?></p>
        </div>
        <div class="stat-card green">
            <p class="stat-label">Total Aprendices</p>
            <p class="stat-value"><?= $totalAprendices ?></p>
        </div>
        <div class="stat-card purple">
            <p class="stat-label">Emparejamientos Activos</p>
            <p class="stat-value"><?= $totalEmparejamientos ?></p>
        </div>
    </div>
    
    <div class="tabs">
        <button class="tab-btn <?= $tipo === 'mentor' ? 'active' : '' ?>" 
                onclick="window.location.href='crud.php?tipo=mentor'">
            👨‍🏫 Gestionar Mentores
        </button>
        <button class="tab-btn <?= $tipo === 'aprendiz' ? 'active' : '' ?>" 
                onclick="window.location.href='crud.php?tipo=aprendiz'">
            🎓 Gestionar Aprendices
        </button>
    </div>
    
    <div class="content">
        <?php if ($mensaje): ?>
            <div class="alert success">✅ <?= htmlspecialchars($mensaje) ?></div>
        <?php elseif ($error): ?>
            <div class="alert error">❌ <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <h2><?= $registroEditar ? '✏️ Editar' : '➕ Crear Nuevo' ?> <?= ucfirst($tipo) ?></h2>
        
        <form method="POST">
            <?php if ($registroEditar): ?>
                <input type="hidden" name="id" value="<?= $registroEditar['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label>Nombre Completo *</label>
                <input type="text" name="nombre" value="<?= $registroEditar['nombre'] ?? '' ?>" required>
            </div>
            
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" value="<?= $registroEditar['email'] ?? '' ?>" required>
            </div>
            
            <div class="form-group">
                <label>Contraseña <?= $registroEditar ? '(dejar vacío para mantener)' : '*' ?></label>
                <input type="password" name="password" <?= $registroEditar ? '' : 'required' ?> 
                       placeholder="Mínimo 6 caracteres" minlength="6">
            </div>
            
            <div class="form-group">
                <label>Carrera *</label>
                <select name="carrera" required>
                    <option value="">Seleccionar</option>
                    <?php
                        $carreras = ['Ingeniería en Sistemas', 'Ingeniería Industrial', 'Administración', 'Contabilidad', 'Derecho', 'Medicina', 'Arquitectura'];
                        foreach ($carreras as $c) {
                            $selected = (isset($registroEditar['carrera']) && $registroEditar['carrera'] === $c) ? 'selected' : '';
                            echo "<option value=\"$c\" $selected>$c</option>";
                        }
                    ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>Semestre *</label>
                <input type="number" name="semestre" min="1" max="12" 
                       value="<?= $registroEditar['semestre'] ?? '' ?>" required>
            </div>
            
            <div class="form-group full">
                <label>Materias (separadas por comas) *</label>
                <textarea name="materias" required 
                          placeholder="Ejemplo: Cálculo, Programación, Bases de Datos"><?= $registroEditar['materias'] ?? '' ?></textarea>
            </div>
            
            <div class="form-group full">
                <label>Habilidades (separadas por comas) *</label>
                <textarea name="habilidades" required 
                          placeholder="Ejemplo: Python, JavaScript, Liderazgo"><?= $registroEditar['habilidades'] ?? '' ?></textarea>
            </div>
            
            <div class="form-group full">
                <label>Disponibilidad *</label>
                <input type="text" name="disponibilidad" 
                       value="<?= $registroEditar['disponibilidad'] ?? '' ?>" 
                       placeholder="Ejemplo: Lunes y Miércoles 3-5 PM" required>
            </div>
            
            <div class="form-actions">
                <button type="submit" name="<?= $registroEditar ? 'actualizar' : 'crear' ?>" class="btn-primary">
                    <?= $registroEditar ? '💾 Guardar Cambios' : '➕ Crear ' . ucfirst($tipo) ?>
                </button>
                <?php if ($registroEditar): ?>
                    <a href="crud.php?tipo=<?= $tipo ?>" class="btn-secondary" style="padding: 12px 30px; text-decoration: none; display: inline-flex; align-items: center;">
                        ❌ Cancelar
                    </a>
                <?php endif; ?>
            </div>
        </form>

        <h2>📋 Lista de <?= $tipo === 'mentor' ? 'Mentores' : 'Aprendices' ?></h2>
        
        <?php if ($registros->rowCount() === 0): ?>
            <div class="empty-state">
                <p style="font-size: 48px;">📭</p>
                <p style="font-size: 18px; font-weight: 600;">No hay <?= $tipo === 'mentor' ? 'mentores' : 'aprendices' ?> registrados</p>
                <p>Crea el primero usando el formulario de arriba</p>
            </div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Carrera</th>
                        <th>Sem.</th>
                        <th>Materias</th>
                        <th>Habilidades</th>
                        <th>Disponibilidad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($r = $registros->fetch()): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($r['nombre']) ?></strong></td>
                        <td><?= htmlspecialchars($r['email']) ?></td>
                        <td><?= htmlspecialchars($r['carrera']) ?></td>
                        <td><?= htmlspecialchars($r['semestre']) ?></td>
                        <td>
                            <div class="tags">
                                <?php 
                                    $materias = json_decode($r['materias']);
                                    foreach (array_slice($materias, 0, 3) as $m) {
                                        echo "<span class='tag'>" . htmlspecialchars($m) . "</span>";
                                    }
                                    if (count($materias) > 3) {
                                        echo "<span class='tag'>+" . (count($materias) - 3) . "</span>";
                                    }
                                ?>
                            </div>
                        </td>
                        <td>
                            <div class="tags">
                                <?php 
                                    $habilidades = json_decode($r['habilidades']);
                                    foreach (array_slice($habilidades, 0, 3) as $h) {
                                        echo "<span class='tag'>" . htmlspecialchars($h) . "</span>";
                                    }
                                    if (count($habilidades) > 3) {
                                        echo "<span class='tag'>+" . (count($habilidades) - 3) . "</span>";
                                    }
                                ?>
                            </div>
                        </td>
                        <td><?= htmlspecialchars($r['disponibilidad']) ?></td>
                        <td>
                            <div class="actions">
                                <a href="crud.php?tipo=<?= $tipo ?>&editar=<?= $r['id'] ?>" class="btn-edit">✏️ Editar</a>
                                <a href="crud.php?tipo=<?= $tipo ?>&eliminar=<?= $r['id'] ?>" class="btn-delete" 
                                   onclick="return confirm('⚠️ ¿Seguro que deseas eliminar este <?= $tipo ?>?\n\nEsto también eliminará su cuenta de usuario.')">
                                   🗑️ Eliminar
                                </a>
                            </div>
                        </td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
</body>
</html>