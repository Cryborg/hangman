<?php
/**
 * Bootstrap pour les tests PHPUnit
 * Configure l'environnement de test
 */

// IMPORTANT : Charger l'environnement de test AVANT toute initialisation
$testEnvFile = __DIR__ . '/../.env.test';
if (file_exists($testEnvFile)) {
    $lines = file($testEnvFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || trim($line) === '') {
            continue; // Ignorer les commentaires et lignes vides
        }
        
        [$key, $value] = explode('=', $line, 2);
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

// Configuration de l'environnement de test
define('TEST_MODE', true);

// URL d'API selon l'environnement
$apiBaseUrl = $_ENV['API_BASE_URL'] ?? 'http://localhost:8090';
if (file_exists('/.dockerenv') || getenv('container') !== false) {
    $apiBaseUrl = 'http://localhost';
}
define('API_BASE_URL', $apiBaseUrl);

// Helper pour faire des requêtes HTTP
class TestHttpClient {
    private static $sessionCookie = null;
    
    public static function request(string $method, string $url, array $data = [], array $headers = []): array {
        $ch = curl_init();
        
        $fullUrl = API_BASE_URL . $url;
        
        // Options de base
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/phpunit_cookies.txt');
        curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/phpunit_cookies.txt');
        
        // Headers par défaut
        $defaultHeaders = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        
        $finalHeaders = array_merge($defaultHeaders, $headers);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $finalHeaders);
        
        // Données pour POST/PUT
        if (!empty($data) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        // Exécution
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        
        // Séparer headers et body
        $headers = substr($response, 0, $headerSize);
        $body = substr($response, $headerSize);
        
        curl_close($ch);
        
        // Decoder le JSON ou garder le body brut si ça échoue
        $jsonBody = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Debug en cas de JSON invalide
            if (getenv('PHPUNIT_DEBUG')) {
                echo "Invalid JSON response: $body\n";
            }
            $jsonBody = ['raw_body' => $body];
        }
        
        return [
            'code' => $httpCode,
            'body' => $jsonBody,
            'headers' => $headers
        ];
    }
    
    public static function login(string $username, string $password): bool {
        // Reset cookies avant login
        @unlink('/tmp/phpunit_cookies.txt');
        
        $response = self::request('POST', '/api/admin/auth.php', [
            'action' => 'login',
            'username' => $username,
            'password' => $password
        ]);
        
        // Debug pour voir ce qui se passe
        if (getenv('PHPUNIT_DEBUG')) {
            echo "Login response code: " . $response['code'] . "\n";
            echo "Login response body: " . json_encode($response['body']) . "\n";
        }
        
        return $response['code'] === 200 && 
               isset($response['body']['success']) && 
               $response['body']['success'] === true;
    }
    
    public static function logout(): void {
        self::request('POST', '/api/admin/auth.php', [
            'action' => 'logout'
        ]);
        // Reset cookies completely
        @unlink('/tmp/phpunit_cookies.txt');
        self::$sessionCookie = null;
    }
    
    public static function resetSession(): void {
        self::$sessionCookie = null;
    }
}

// Fonction helper pour debug
function dd($data): void {
    var_dump($data);
    die();
}