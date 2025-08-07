<?php
/**
 * Validateur d'entrées pour l'API
 * Principe SOLID : Single Responsibility - validation et sanitisation uniquement
 * Principe DRY : Centralise toute la logique de validation
 * 
 * @version 1.0.0
 */

class Validator {
    
    /**
     * Valide les paramètres requis dans une requête
     */
    public static function validateRequired(array $data, array $requiredFields): array {
        $errors = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $errors[] = "Le champ '{$field}' est requis";
            }
        }
        
        return $errors;
    }
    
    /**
     * Valide et nettoie un entier avec limites optionnelles
     */
    public static function validateInt($value, ?int $min = null, ?int $max = null): array {
        $cleanValue = filter_var($value, FILTER_VALIDATE_INT);
        $errors = [];
        
        if ($cleanValue === false) {
            $errors[] = "Valeur entière invalide";
            return ['value' => null, 'errors' => $errors];
        }
        
        if ($min !== null && $cleanValue < $min) {
            $errors[] = "La valeur doit être supérieure ou égale à {$min}";
        }
        
        if ($max !== null && $cleanValue > $max) {
            $errors[] = "La valeur doit être inférieure ou égale à {$max}";
        }
        
        return [
            'value' => empty($errors) ? $cleanValue : null,
            'errors' => $errors
        ];
    }
    
    /**
     * Valide un niveau de difficulté
     */
    public static function validateDifficulty(string $difficulty): array {
        $validDifficulties = ['easy', 'medium', 'hard'];
        
        if (!in_array($difficulty, $validDifficulties)) {
            return [
                'value' => null,
                'errors' => ["Difficulté invalide. Valeurs acceptées : " . implode(', ', $validDifficulties)]
            ];
        }
        
        return ['value' => $difficulty, 'errors' => []];
    }
    
    /**
     * Valide les paramètres de pagination
     */
    public static function validatePagination(array $params): array {
        $page = $params['page'] ?? 1;
        $limit = $params['limit'] ?? 50;
        $search = $params['search'] ?? '';
        
        $pageValidation = self::validateInt($page, 1);
        $limitValidation = self::validateInt($limit, 1, 100);
        
        $errors = array_merge($pageValidation['errors'], $limitValidation['errors']);
        
        return [
            'page' => $pageValidation['value'] ?? 1,
            'limit' => $limitValidation['value'] ?? 50,
            'search' => self::sanitizeString($search),
            'errors' => $errors
        ];
    }
    
    /**
     * Nettoie et sécurise une chaîne
     */
    public static function sanitizeString(string $str): string {
        return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Valide une couleur hexadécimale
     */
    public static function validateHexColor(string $color): array {
        $color = trim($color);
        
        if (!preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $color)) {
            return [
                'value' => null,
                'errors' => ["Format de couleur invalide. Utilisez le format hexadécimal (#123456)"]
            ];
        }
        
        return ['value' => $color, 'errors' => []];
    }
    
    /**
     * Valide un slug (identifiant URL-friendly)
     */
    public static function validateSlug(string $slug): array {
        $slug = trim($slug);
        $errors = [];
        
        if (empty($slug)) {
            $errors[] = "Le slug ne peut pas être vide";
        }
        
        if (!preg_match('/^[a-z0-9\-]+$/', $slug)) {
            $errors[] = "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets";
        }
        
        if (strlen($slug) > 100) {
            $errors[] = "Le slug ne peut pas dépasser 100 caractères";
        }
        
        return [
            'value' => empty($errors) ? $slug : null,
            'errors' => $errors
        ];
    }
    
    /**
     * Valide une adresse email
     */
    public static function validateEmail(string $email): array {
        $cleanEmail = filter_var(trim($email), FILTER_VALIDATE_EMAIL);
        
        if ($cleanEmail === false) {
            return [
                'value' => null,
                'errors' => ["Adresse email invalide"]
            ];
        }
        
        return ['value' => $cleanEmail, 'errors' => []];
    }
    
    /**
     * Valide les données JSON d'entrée
     */
    public static function validateJsonInput(): array {
        $input = json_decode(file_get_contents('php://input'), true);
        $errors = [];
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $errors[] = "Données JSON invalides : " . json_last_error_msg();
            return ['data' => null, 'errors' => $errors];
        }
        
        if (!is_array($input)) {
            $errors[] = "Les données JSON doivent être un objet";
            return ['data' => null, 'errors' => $errors];
        }
        
        return ['data' => $input, 'errors' => []];
    }
    
    /**
     * Valide une URL
     */
    public static function validateUrl(string $url): array {
        $cleanUrl = filter_var(trim($url), FILTER_VALIDATE_URL);
        
        if ($cleanUrl === false) {
            return [
                'value' => null,
                'errors' => ["URL invalide"]
            ];
        }
        
        return ['value' => $cleanUrl, 'errors' => []];
    }
    
    /**
     * Valide un nom (catégorie, tag, etc.)
     */
    public static function validateName(string $name, int $minLength = 1, int $maxLength = 100): array {
        $name = trim($name);
        $errors = [];
        
        if (strlen($name) < $minLength) {
            $errors[] = "Le nom doit contenir au moins {$minLength} caractère(s)";
        }
        
        if (strlen($name) > $maxLength) {
            $errors[] = "Le nom ne peut pas dépasser {$maxLength} caractères";
        }
        
        // Pas de caractères de contrôle ou dangereux
        if (preg_match('/[\x00-\x1F\x7F]/', $name)) {
            $errors[] = "Le nom contient des caractères non autorisés";
        }
        
        return [
            'value' => empty($errors) ? $name : null,
            'errors' => $errors
        ];
    }
    
    /**
     * Valide un booléen depuis différents types d'entrées
     */
    public static function validateBoolean($value): bool {
        if (is_bool($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes', 'on']);
        }
        
        return (bool) $value;
    }
}