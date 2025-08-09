<?php
/**
 * Gestionnaire unifié des réponses HTTP API
 * Principe SOLID : Single Responsibility - gestion des réponses uniquement
 * Principe DRY : Centralise tout le formatting des réponses
 * Principe KISS : Interface simple et cohérente
 * 
 * @version 1.0.0
 */

class ResponseManager {
    
    /**
     * Envoie une réponse de succès (200)
     */
    public function success($data = null, array $meta = []): void {
        $this->sendResponse(200, [
            'success' => true,
            'data' => $data,
            'meta' => $meta,
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envoie une réponse de création (201)
     */
    public function created($data = null, array $meta = []): void {
        $this->sendResponse(201, [
            'success' => true,
            'data' => $data,
            'meta' => $meta,
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envoie une réponse d'erreur de validation (400)
     */
    public function badRequest(string $message, array $errors = []): void {
        $this->sendResponse(400, [
            'success' => false,
            'error' => [
                'code' => 400,
                'message' => $message,
                'details' => $errors
            ],
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envoie une réponse non trouvé (404)
     */
    public function notFound(string $message = 'Resource not found'): void {
        $this->sendResponse(404, [
            'success' => false,
            'error' => [
                'code' => 404,
                'message' => $message
            ],
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envoie une réponse conflit (409)
     */
    public function conflict(string $message, array $details = []): void {
        $this->sendResponse(409, [
            'success' => false,
            'error' => [
                'code' => 409,
                'message' => $message,
                'details' => $details
            ],
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envoie une réponse méthode non autorisée (405)
     */
    public function methodNotAllowed(): void {
        $this->sendResponse(405, [
            'success' => false,
            'error' => [
                'code' => 405,
                'message' => 'Method not allowed'
            ],
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Envoie une réponse d'erreur serveur (500)
     */
    public function error(int $code = 500, string $message = 'Internal server error', string $details = null): void {
        $error = [
            'code' => $code,
            'message' => $message
        ];
        
        if ($details && ini_get('display_errors')) {
            $error['details'] = $details;
        }
        
        $this->sendResponse($code, [
            'success' => false,
            'error' => $error,
            'timestamp' => date('c')
        ]);
    }
    
    /**
     * Méthode centrale pour envoyer une réponse JSON
     */
    private function sendResponse(int $httpCode, array $data): void {
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=utf-8');
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}