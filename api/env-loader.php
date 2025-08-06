<?php
/**
 * Environment Loader - Parser .env à la façon Laravel
 * 
 * Charge et parse le fichier .env pour rendre les variables disponibles
 * via getenv() et $_ENV
 * 
 * @version 1.0.0
 */

class EnvLoader {
    private $envFile;
    private $loaded = false;
    
    public function __construct($envFile = null) {
        if ($envFile === null) {
            // Chercher le .env à la racine du projet (un niveau au-dessus de /api)
            $this->envFile = dirname(__DIR__) . '/.env';
        } else {
            $this->envFile = $envFile;
        }
    }
    
    /**
     * Charge le fichier .env
     */
    public function load() {
        if ($this->loaded) {
            return true;
        }
        
        if (!file_exists($this->envFile)) {
            throw new Exception("Environment file not found: {$this->envFile}");
        }
        
        if (!is_readable($this->envFile)) {
            throw new Exception("Environment file is not readable: {$this->envFile}");
        }
        
        $lines = file($this->envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            $this->parseLine($line);
        }
        
        $this->loaded = true;
        return true;
    }
    
    /**
     * Parse une ligne du fichier .env
     */
    private function parseLine($line) {
        // Ignorer les commentaires
        if (strpos(trim($line), '#') === 0) {
            return;
        }
        
        // Chercher le pattern KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            
            $key = trim($key);
            $value = trim($value);
            
            // Retirer les guillemets si présents
            $value = $this->removeQuotes($value);
            
            // Convertir les booléens et null
            $value = $this->convertValue($value);
            
            // Définir la variable d'environnement
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
    
    /**
     * Retire les guillemets autour des valeurs
     */
    private function removeQuotes($value) {
        $firstChar = substr($value, 0, 1);
        $lastChar = substr($value, -1);
        
        if (($firstChar === '"' && $lastChar === '"') || 
            ($firstChar === "'" && $lastChar === "'")) {
            return substr($value, 1, -1);
        }
        
        return $value;
    }
    
    /**
     * Convertit les valeurs spéciales (booléens, null, etc.)
     */
    private function convertValue($value) {
        switch (strtolower($value)) {
            case 'true':
                return true;
            case 'false':
                return false;
            case 'null':
                return null;
            case 'empty':
                return '';
            default:
                return $value;
        }
    }
    
    /**
     * Vérifie si le loader est chargé
     */
    public function isLoaded() {
        return $this->loaded;
    }
    
    /**
     * Obtient le chemin du fichier .env
     */
    public function getEnvFile() {
        return $this->envFile;
    }
}

/**
 * Fonctions helper globales à la façon Laravel
 */

if (!function_exists('env')) {
    /**
     * Obtient une variable d'environnement avec valeur par défaut
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    function env($key, $default = null) {
        $value = getenv($key);
        
        if ($value === false) {
            return $default;
        }
        
        return $value;
    }
}

if (!function_exists('config')) {
    /**
     * Helper pour obtenir les configurations (pour compatibilité future)
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    function config($key, $default = null) {
        // Pour l'instant, utilise directement env()
        // Dans une version plus avancée, on pourrait avoir des fichiers de config séparés
        return env($key, $default);
    }
}

// Auto-loader : charge automatiquement le .env quand ce fichier est inclus
try {
    $envLoader = new EnvLoader();
    $envLoader->load();
} catch (Exception $e) {
    // En cas d'erreur, log mais ne pas planter l'application
    error_log("Warning: Could not load .env file: " . $e->getMessage());
}
?>