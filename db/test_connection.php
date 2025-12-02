<?php
/**
 * test_connection.php - Script para probar la conexión a la base de datos
 */

require_once 'config.php';

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Test de Conexión - Mentor-Match</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f3f4f6;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .success {
            color: #10b981;
            background: #d1fae5;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        .error {
            color: #ef4444;
            background: #fee2e2;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        .info {
            color: #2563eb;
            background: #dbeafe;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        h1 {
            color: #1f2937;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔍 Test de Conexión - Mentor-Match</h1>";

try {
    $db = getDB();
    echo "<div class='success'>✅ <strong>Conexión exitosa a MySQL</strong></div>";
    
    // Información de la conexión
    echo "<div class='info'>";
    echo "<strong>Información de conexión:</strong><br>";
    echo "Host: " . DB_HOST . "<br>";
    echo "Base de datos: " . DB_NAME . "<br>";
    echo "Usuario: " . DB_USER . "<br>";
    echo "Charset: " . DB_CHARSET;
    echo "</div>";
    
    // Verificar tablas
    echo "<h2>📊 Tablas en la base de datos:</h2>";
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "<div class='error'>❌ No se encontraron tablas. Por favor ejecuta el script mentoria_database.sql</div>";
    } else {
        echo "<table>";
        echo "<thead><tr><th>Tabla</th><th>Registros</th></tr></thead>";
        echo "<tbody>";
        
        foreach ($tables as $table) {
            $stmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch();
            echo "<tr><td>$table</td><td>{$count['count']}</td></tr>";
        }
        
        echo "</tbody></table>";
    }
    
    // Verificar datos de ejemplo
    echo "<h2>👥 Datos de ejemplo:</h2>";
    
    $stmt = $db->query("SELECT nombre, email, carrera FROM mentores LIMIT 3");
    $mentores = $stmt->fetchAll();
    
    if (!empty($mentores)) {
        echo "<div class='success'><strong>Mentores encontrados:</strong></div>";
        echo "<table>";
        echo "<thead><tr><th>Nombre</th><th>Email</th><th>Carrera</th></tr></thead>";
        echo "<tbody>";
        foreach ($mentores as $mentor) {
            echo "<tr><td>{$mentor['nombre']}</td><td>{$mentor['email']}</td><td>{$mentor['carrera']}</td></tr>";
        }
        echo "</tbody></table>";
    }
    
    $stmt = $db->query("SELECT nombre, email, carrera FROM aprendices LIMIT 3");
    $aprendices = $stmt->fetchAll();
    
    if (!empty($aprendices)) {
        echo "<div class='success'><strong>Aprendices encontrados:</strong></div>";
        echo "<table>";
        echo "<thead><tr><th>Nombre</th><th>Email</th><th>Carrera</th></tr></thead>";
        echo "<tbody>";
        foreach ($aprendices as $aprendiz) {
            echo "<tr><td>{$aprendiz['nombre']}</td><td>{$aprendiz['email']}</td><td>{$aprendiz['carrera']}</td></tr>";
        }
        echo "</tbody></table>";
    }
    
    echo "<div class='success'>✅ <strong>Todo está funcionando correctamente!</strong></div>";
    echo "<div class='info'>Ahora puedes acceder a la aplicación en: <a href='../index.html'>index.html</a></div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>";
    echo "❌ <strong>Error de conexión:</strong><br>";
    echo $e->getMessage();
    echo "<br><br>";
    echo "<strong>Posibles soluciones:</strong><br>";
    echo "1. Verifica que XAMPP esté corriendo (Apache y MySQL)<br>";
    echo "2. Asegúrate de haber ejecutado el script mentoria_database.sql en phpMyAdmin<br>";
    echo "3. Verifica las credenciales en db/config.php";
    echo "</div>";
}

echo "    </div>
</body>
</html>";