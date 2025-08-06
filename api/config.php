<?php
/**
 * Configuration centralisée pour l'API Hangman
 * Utilise le système .env à la façon Laravel
 * 
 * @version 2.0.0
 * @author API Migration System
 */

// Charger les variables d'environnement depuis .env
require_once 'env-loader.php';

// Configuration de l'application
define('APP_NAME', env('APP_NAME', 'Hangman Game'));
define('APP_ENV', env('APP_ENV', 'local'));
define('APP_DEBUG', env('APP_DEBUG', true));
define('APP_VERSION', env('APP_VERSION', '5.0.0'));

// Configuration de la base de données
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_PORT', env('DB_PORT', 3306));
define('DB_NAME', env('DB_DATABASE', 'hangman_db'));
define('DB_USER', env('DB_USERNAME', 'hangman_user'));
define('DB_PASS', env('DB_PASSWORD', 'hangman_password'));
define('DB_CHARSET', 'utf8mb4');

// Configuration de l'API
define('API_VERSION', env('API_VERSION', '1.0.0'));
define('API_BASE_PATH', env('API_BASE_PATH', '/games/pendu/api'));
define('API_CACHE_TTL', env('API_CACHE_TTL', 300));
define('API_DEBUG', env('API_DEBUG', false));
define('API_TIMEOUT', env('API_TIMEOUT', 30));

// Configuration du cache
define('CACHE_ENABLED', env('CACHE_ENABLED', true));
define('CACHE_TTL', env('CACHE_TTL', 300));

// Configuration CORS
define('CORS_ALLOWED_ORIGINS', env('CORS_ALLOWED_ORIGINS', '*'));
define('CORS_ALLOWED_METHODS', env('CORS_ALLOWED_METHODS', 'GET,POST,OPTIONS'));
define('CORS_ALLOWED_HEADERS', env('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization'));

// Mode maintenance
define('MAINTENANCE_MODE', env('MAINTENANCE_MODE', false));
define('MAINTENANCE_MESSAGE', env('MAINTENANCE_MESSAGE', 'Le jeu est temporairement en maintenance.'));
define('MAINTENANCE_DURATION_MINUTES', env('MAINTENANCE_DURATION_MINUTES', 60));

// Administration
define('ADMIN_ENABLED', env('FEATURE_ADMIN_PANEL', false));
define('ADMIN_USERNAME', env('ADMIN_USERNAME', 'admin'));
define('ADMIN_PASSWORD', env('ADMIN_PASSWORD', ''));
define('ADMIN_SESSION_TIMEOUT', env('ADMIN_SESSION_TIMEOUT', 3600));


// Vérifier le mode maintenance
if (MAINTENANCE_MODE) {
    http_response_code(503);
    $retryAfterSeconds = MAINTENANCE_DURATION_MINUTES * 60;
    $maintenance = [
        'success' => false,
        'maintenance' => true,
        'message' => MAINTENANCE_MESSAGE,
        'retry_after' => $retryAfterSeconds,
        'duration_minutes' => MAINTENANCE_DURATION_MINUTES
    ];
    header('Retry-After: ' . $retryAfterSeconds);
    echo json_encode($maintenance, JSON_UNESCAPED_UNICODE);
    exit();
}

// Headers CORS pour permettre les requêtes JavaScript
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: ' . CORS_ALLOWED_METHODS);
header('Access-Control-Allow-Headers: ' . CORS_ALLOWED_HEADERS);

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Classe de connexion à la base de données
 */
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE utf8mb4_unicode_ci",
                PDO::ATTR_TIMEOUT            => API_TIMEOUT
            ];
            
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            // Force UTF-8 sur la connexion
            $this->pdo->exec("SET character_set_client=utf8mb4");
            $this->pdo->exec("SET character_set_connection=utf8mb4");
            $this->pdo->exec("SET character_set_results=utf8mb4");
            
        } catch (PDOException $e) {
            $this->sendError(500, 'Database connection failed', $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    private function sendError($code, $message, $details = null) {
        http_response_code($code);
        $error = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'api_version' => API_VERSION
            ]
        ];
        
        if ($details && APP_DEBUG) {
            $error['error']['details'] = $details;
        }
        
        echo json_encode($error, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
}

/**
 * Fonctions utilitaires
 */
function sendSuccessResponse($data, $meta = []) {
    $response = [
        'success' => true,
        'data' => $data,
        'meta' => array_merge([
            'api_version' => API_VERSION,
            'timestamp' => date('c'),
            'count' => is_array($data) ? count($data) : 1
        ], $meta)
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function sendErrorResponse($code, $message, $details = null) {
    http_response_code($code);
    $response = [
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message,
            'api_version' => API_VERSION,
            'timestamp' => date('c')
        ]
    ];
    
    if ($details && APP_DEBUG) {
        $response['error']['details'] = $details;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function validateRequest($requiredParams = []) {
    foreach ($requiredParams as $param) {
        if (!isset($_GET[$param]) || empty($_GET[$param])) {
            sendErrorResponse(400, "Missing required parameter: $param");
            exit();
        }
    }
}

function sanitizeString($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

function sanitizeInt($int, $min = null, $max = null) {
    $value = filter_var($int, FILTER_VALIDATE_INT);
    if ($value === false) {
        return false;
    }
    
    if ($min !== null && $value < $min) {
        return false;
    }
    
    if ($max !== null && $value > $max) {
        return false;
    }
    
    return $value;
}
?>