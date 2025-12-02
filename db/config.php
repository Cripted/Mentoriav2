<?php
/**
 * config.php - Configuración de la Base de Datos MySQL
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'mentoria');
define('DB_USER', 'root');
define('DB_PASS', ''); // Por defecto XAMPP no tiene contraseña
define('DB_CHARSET', 'utf8mb4');

// Clase de conexión a la base de datos
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    // Prevenir clonación del objeto
    private function __clone() {}

    // Prevenir deserialización del objeto
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Función helper para obtener la conexión
function getDB() {
    return Database::getInstance()->getConnection();
}