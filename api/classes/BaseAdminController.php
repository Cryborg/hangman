<?php
/**
 * Contrôleur de base pour tous les endpoints d'administration
 * Principe SOLID : Template Method Pattern + Single Responsibility
 * Principe DRY : Centralise toute la logique CRUD commune
 * Principe KISS : Interface simple et cohérente
 * 
 * @version 1.0.0
 */

require_once __DIR__ . '/ResponseManager.php';
require_once __DIR__ . '/Validator.php';

abstract class BaseAdminController {
    protected PDO $db;
    protected ResponseManager $response;
    protected string $resourceName;
    
    public function __construct(PDO $db, string $resourceName) {
        $this->db = $db;
        $this->response = new ResponseManager();
        $this->resourceName = $resourceName;
    }
    
    /**
     * Point d'entrée principal - Router les requêtes HTTP
     */
    public function handleRequest(): void {
        try {
            switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    $this->handleGet();
                    break;
                case 'POST':
                    $this->handlePost();
                    break;
                case 'PUT':
                    $this->handlePut();
                    break;
                case 'PATCH':
                    $this->handlePatch();
                    break;
                case 'DELETE':
                    $this->handleDelete();
                    break;
                default:
                    $this->response->methodNotAllowed();
            }
        } catch (Exception $e) {
            error_log("API Error in {$this->resourceName}: " . $e->getMessage());
            $this->response->error(500, 'Internal server error', $e->getMessage());
        }
    }
    
    /**
     * GET - Récupérer les ressources
     */
    protected function handleGet(): void {
        $id = $this->getIdFromQuery();
        
        if ($id) {
            $item = $this->findById($id);
            if (!$item) {
                $this->response->notFound(ucfirst($this->resourceName) . ' not found');
                return;
            }
            $this->response->success($this->transformForResponse($item));
        } else {
            $params = $this->getListParameters();
            $validation = Validator::validatePagination($params);
            
            if (!empty($validation['errors'])) {
                $this->response->badRequest('Validation failed', $validation['errors']);
                return;
            }
            
            $result = $this->findWithPagination($validation);
            $this->response->success(
                $this->transformListForResponse($result['items']),
                [
                    'pagination' => [
                        'current_page' => $validation['page'],
                        'per_page' => $validation['limit'],
                        'total' => $result['total'],
                        'total_pages' => ceil($result['total'] / $validation['limit']),
                        'has_more' => ($validation['page'] * $validation['limit']) < $result['total']
                    ],
                    'search' => $validation['search']
                ]
            );
        }
    }
    
    /**
     * POST - Créer une ressource
     */
    protected function handlePost(): void {
        $validation = Validator::validateJsonInput();
        if (!empty($validation['errors'])) {
            $this->response->badRequest('Invalid JSON input', $validation['errors']);
            return;
        }
        
        $data = $validation['data'];
        $validation = $this->validateForCreate($data);
        
        if (!empty($validation['errors'])) {
            $this->response->badRequest('Validation failed', $validation['errors']);
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            $id = $this->create($validation['data']);
            $item = $this->findById($id);
            
            $this->db->commit();
            
            $this->response->created(
                $this->transformForResponse($item),
                ['message' => ucfirst($this->resourceName) . ' created successfully']
            );
            
        } catch (InvalidArgumentException $e) {
            $this->db->rollBack();
            $this->response->badRequest($e->getMessage());
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * PUT - Mettre à jour une ressource
     */
    protected function handlePut(): void {
        $validation = Validator::validateJsonInput();
        if (!empty($validation['errors'])) {
            $this->response->badRequest('Invalid JSON input', $validation['errors']);
            return;
        }
        
        $data = $validation['data'];
        if (!isset($data['id'])) {
            $this->response->badRequest('ID is required');
            return;
        }
        
        $id = (int) $data['id'];
        if (!$this->findById($id)) {
            $this->response->notFound(ucfirst($this->resourceName) . ' not found');
            return;
        }
        
        $validation = $this->validateForUpdate($data);
        if (!empty($validation['errors'])) {
            $this->response->badRequest('Validation failed', $validation['errors']);
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            $this->update($id, $validation['data']);
            $item = $this->findById($id);
            
            $this->db->commit();
            
            $this->response->success(
                $this->transformForResponse($item),
                ['message' => ucfirst($this->resourceName) . ' updated successfully']
            );
            
        } catch (InvalidArgumentException $e) {
            $this->db->rollBack();
            $this->response->badRequest($e->getMessage());
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * DELETE - Supprimer une ressource
     */
    protected function handleDelete(): void {
        $id = $this->getIdFromQuery();
        if (!$id) {
            $this->response->badRequest('ID parameter is required');
            return;
        }
        
        $item = $this->findById($id);
        if (!$item) {
            $this->response->notFound(ucfirst($this->resourceName) . ' not found');
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            $this->delete($id);
            
            $this->db->commit();
            
            $this->response->success(
                ['id' => $id],
                ['message' => ucfirst($this->resourceName) . ' deleted successfully']
            );
            
        } catch (InvalidArgumentException $e) {
            $this->db->rollBack();
            $this->response->badRequest($e->getMessage());
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * PATCH - Mises à jour batch (optionnel - à implémenter dans les classes filles)
     */
    protected function handlePatch(): void {
        $this->response->methodNotAllowed('PATCH not implemented for this resource');
    }
    
    // ===== MÉTHODES UTILITAIRES =====
    
    protected function getIdFromQuery(): ?int {
        return isset($_GET['id']) ? (int) $_GET['id'] : null;
    }
    
    protected function getListParameters(): array {
        return [
            'page' => $_GET['page'] ?? 1,
            'limit' => $_GET['limit'] ?? 50,
            'search' => $_GET['search'] ?? ''
        ];
    }
    
    // ===== MÉTHODES ABSTRAITES À IMPLÉMENTER =====
    
    /**
     * Trouve une ressource par ID
     */
    abstract protected function findById(int $id): ?array;
    
    /**
     * Trouve les ressources avec pagination
     */
    abstract protected function findWithPagination(array $params): array;
    
    /**
     * Crée une nouvelle ressource
     */
    abstract protected function create(array $data): int;
    
    /**
     * Met à jour une ressource
     */
    abstract protected function update(int $id, array $data): bool;
    
    /**
     * Supprime une ressource
     */
    abstract protected function delete(int $id): bool;
    
    /**
     * Valide les données pour la création
     */
    abstract protected function validateForCreate(array $data): array;
    
    /**
     * Valide les données pour la mise à jour
     */
    abstract protected function validateForUpdate(array $data): array;
    
    /**
     * Transforme un item pour la réponse API
     */
    abstract protected function transformForResponse(array $item): array;
    
    /**
     * Transforme une liste d'items pour la réponse API
     */
    protected function transformListForResponse(array $items): array {
        return array_map([$this, 'transformForResponse'], $items);
    }
}