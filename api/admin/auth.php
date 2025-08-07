<?php
/**
 * Système d'authentification simple pour l'interface d'administration
 * 
 * @version 1.0.0
 */

require_once __DIR__ . '/../config.php';

class AdminAuth {
    private static $sessionKey = 'hangman_admin_session';
    
    /**
     * Vérifie si l'administration est activée
     */
    public static function isAdminEnabled() {
        return ADMIN_ENABLED && !empty(ADMIN_USERNAME) && !empty(ADMIN_PASSWORD);
    }
    
    /**
     * Démarre la session si ce n'est pas déjà fait
     */
    private static function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Authentifie un utilisateur admin
     */
    public static function login($username, $password) {
        if (!self::isAdminEnabled()) {
            return [
                'success' => false,
                'error' => 'Interface d\'administration désactivée'
            ];
        }
        
        if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
            self::startSession();
            $_SESSION[self::$sessionKey] = [
                'username' => $username,
                'login_time' => time(),
                'last_activity' => time()
            ];
            
            return [
                'success' => true,
                'message' => 'Connexion réussie',
                'session_timeout' => ADMIN_SESSION_TIMEOUT
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Identifiants incorrects'
        ];
    }
    
    /**
     * Déconnecte l'utilisateur admin
     */
    public static function logout() {
        self::startSession();
        unset($_SESSION[self::$sessionKey]);
        session_destroy();
        
        return [
            'success' => true,
            'message' => 'Déconnexion réussie'
        ];
    }
    
    /**
     * Vérifie si l'utilisateur est connecté
     */
    public static function isLoggedIn() {
        if (!self::isAdminEnabled()) {
            return false;
        }
        
        self::startSession();
        
        if (!isset($_SESSION[self::$sessionKey])) {
            return false;
        }
        
        $session = $_SESSION[self::$sessionKey];
        
        // Vérifier le timeout
        if (time() - $session['last_activity'] > ADMIN_SESSION_TIMEOUT) {
            self::logout();
            return false;
        }
        
        // Mettre à jour la dernière activité
        $_SESSION[self::$sessionKey]['last_activity'] = time();
        
        return true;
    }
    
    /**
     * Obtient les informations de session
     */
    public static function getSessionInfo() {
        if (!self::isLoggedIn()) {
            return null;
        }
        
        return $_SESSION[self::$sessionKey];
    }
    
    /**
     * Middleware pour protéger les endpoints admin
     */
    public static function requireAuth() {
        if (!self::isLoggedIn()) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => [
                    'code' => 401,
                    'message' => 'Authentification requise',
                    'admin_enabled' => self::isAdminEnabled()
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    
    /**
     * Vérifie la force du mot de passe (pour la config)
     */
    public static function checkPasswordStrength($password) {
        $score = 0;
        $feedback = [];
        
        if (strlen($password) >= 8) {
            $score += 25;
        } else {
            $feedback[] = "Le mot de passe doit contenir au moins 8 caractères";
        }
        
        if (preg_match('/[a-z]/', $password)) {
            $score += 25;
        } else {
            $feedback[] = "Ajoutez des lettres minuscules";
        }
        
        if (preg_match('/[A-Z]/', $password)) {
            $score += 25;
        } else {
            $feedback[] = "Ajoutez des lettres majuscules";
        }
        
        if (preg_match('/[0-9]/', $password)) {
            $score += 25;
        } else {
            $feedback[] = "Ajoutez des chiffres";
        }
        
        return [
            'score' => $score,
            'level' => $score < 50 ? 'faible' : ($score < 75 ? 'moyen' : 'fort'),
            'feedback' => $feedback
        ];
    }
}

// Endpoint pour les requêtes d'authentification
$isAuthRequest = basename($_SERVER['SCRIPT_NAME']) === 'auth.php';

if ($isAuthRequest && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse(400, 'Invalid JSON input');
        exit();
    }
    
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'login':
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            
            if (empty($username) || empty($password)) {
                sendErrorResponse(400, 'Username and password required');
                exit();
            }
            
            $result = AdminAuth::login($username, $password);
            
            if ($result['success']) {
                sendSuccessResponse($result);
            } else {
                sendErrorResponse(401, $result['error']);
            }
            break;
            
        case 'logout':
            $result = AdminAuth::logout();
            sendSuccessResponse($result);
            break;
            
        case 'check':
            $isLoggedIn = AdminAuth::isLoggedIn();
            $sessionInfo = $isLoggedIn ? AdminAuth::getSessionInfo() : null;
            
            sendSuccessResponse([
                'logged_in' => $isLoggedIn,
                'session_info' => $sessionInfo,
                'admin_enabled' => AdminAuth::isAdminEnabled()
            ]);
            break;
            
        default:
            sendErrorResponse(400, 'Invalid action');
    }
    
} elseif ($isAuthRequest && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // Info sur l'état de l'authentification
    $isLoggedIn = AdminAuth::isLoggedIn();
    $sessionInfo = $isLoggedIn ? AdminAuth::getSessionInfo() : null;
    
    sendSuccessResponse([
        'logged_in' => $isLoggedIn,
        'session_info' => $sessionInfo,
        'admin_enabled' => AdminAuth::isAdminEnabled(),
        'session_timeout' => ADMIN_SESSION_TIMEOUT
    ]);
    
} elseif ($isAuthRequest) {
    sendErrorResponse(405, 'Method not allowed');
}
?>