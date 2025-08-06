<?php
/**
 * Script de configuration initiale du jeu Hangman
 * 
 * Ce script aide à configurer rapidement le jeu avec les bonnes variables d'environnement
 * 
 * Usage: php setup.php
 */

class HangmanSetup {
    private $envFile;
    private $envExampleFile;
    
    public function __construct() {
        $this->envFile = __DIR__ . '/.env';
        $this->envExampleFile = __DIR__ . '/.env.example';
    }
    
    public function run() {
        $this->printHeader();
        
        if (!$this->isInteractive()) {
            $this->printError("Ce script doit être exécuté en mode interactif.");
            exit(1);
        }
        
        // Vérifier si .env existe déjà
        if (file_exists($this->envFile)) {
            $overwrite = $this->ask("Le fichier .env existe déjà. Voulez-vous le reconfigurer ? (y/n)", 'n');
            if (strtolower($overwrite) !== 'y') {
                $this->printSuccess("Configuration annulée.");
                return;
            }
        }
        
        $this->copyEnvExample();
        $this->configureDatabase();
        $this->configureApi();
        $this->testConfiguration();
        
        $this->printSuccess("✅ Configuration terminée !");
        $this->printInfo("Vous pouvez maintenant utiliser l'API Hangman.");
        $this->printInfo("Documentation : http://votre-domaine" . $this->getEnvValue('API_BASE_PATH', '/games/pendu/api') . "/");
    }
    
    private function printHeader() {
        echo "\n";
        echo "🎲 ==========================================\n";
        echo "   HANGMAN GAME - CONFIGURATION SETUP\n";
        echo "🎲 ==========================================\n";
        echo "\n";
        echo "Ce script va vous aider à configurer votre jeu du pendu.\n";
        echo "\n";
    }
    
    private function copyEnvExample() {
        if (!file_exists($this->envExampleFile)) {
            $this->printError("Le fichier .env.example est introuvable.");
            exit(1);
        }
        
        copy($this->envExampleFile, $this->envFile);
        $this->printSuccess("✅ Fichier .env créé depuis .env.example");
    }
    
    private function configureDatabase() {
        echo "📊 CONFIGURATION DE LA BASE DE DONNÉES\n";
        echo "=====================================\n";
        
        $dbHost = $this->ask("Host de la base de données", $this->getEnvValue('DB_HOST', 'localhost'));
        $dbPort = $this->ask("Port de la base de données", $this->getEnvValue('DB_PORT', '3306'));
        $dbName = $this->ask("Nom de la base de données", $this->getEnvValue('DB_DATABASE', 'hangman_db'));
        $dbUser = $this->ask("Utilisateur de la base de données", $this->getEnvValue('DB_USERNAME', 'hangman_user'));
        $dbPass = $this->askSecret("Mot de passe de la base de données");
        
        $this->updateEnvValue('DB_HOST', $dbHost);
        $this->updateEnvValue('DB_PORT', $dbPort);
        $this->updateEnvValue('DB_DATABASE', $dbName);
        $this->updateEnvValue('DB_USERNAME', $dbUser);
        $this->updateEnvValue('DB_PASSWORD', $dbPass);
        
        echo "\n";
    }
    
    private function configureApi() {
        echo "🌐 CONFIGURATION DE L'API\n";
        echo "=========================\n";
        
        $appEnv = $this->ask("Environnement (local/production)", $this->getEnvValue('APP_ENV', 'local'));
        $appDebug = $this->ask("Mode debug (true/false)", $this->getEnvValue('APP_DEBUG', 'false'));
        $apiBasePath = $this->ask("Chemin de base de l'API", $this->getEnvValue('API_BASE_PATH', '/games/pendu/api'));
        
        $this->updateEnvValue('APP_ENV', $appEnv);
        $this->updateEnvValue('APP_DEBUG', $appDebug);
        $this->updateEnvValue('API_BASE_PATH', $apiBasePath);
        
        if ($appEnv === 'production') {
            $this->updateEnvValue('APP_DEBUG', 'false');
            $this->updateEnvValue('API_DEBUG', 'false');
        }
        
        echo "\n";
    }
    
    private function testConfiguration() {
        echo "🧪 TEST DE LA CONFIGURATION\n";
        echo "===========================\n";
        
        // Tester la connexion à la base de données
        try {
            // Charger les nouvelles variables
            $this->loadEnv();
            
            $dsn = "mysql:host=" . getenv('DB_HOST') . ";port=" . getenv('DB_PORT') . ";dbname=" . getenv('DB_DATABASE');
            $pdo = new PDO($dsn, getenv('DB_USERNAME'), getenv('DB_PASSWORD'));
            $this->printSuccess("✅ Connexion à la base de données : OK");
            
            // Vérifier les tables
            $tables = $pdo->query("SHOW TABLES LIKE 'hangman_%'")->fetchAll();
            if (count($tables) > 0) {
                $this->printSuccess("✅ Tables détectées : " . count($tables) . " tables hangman_*");
            } else {
                $this->printWarning("⚠️  Aucune table détectée. N'oubliez pas d'exécuter les scripts SQL.");
                $this->printInfo("   1. mysql < database/schema.sql");
                $this->printInfo("   2. mysql < database/migration.sql");
            }
            
        } catch (PDOException $e) {
            $this->printError("❌ Erreur de connexion BDD : " . $e->getMessage());
        }
        
        echo "\n";
    }
    
    private function ask($question, $default = '') {
        $prompt = $question;
        if ($default !== '') {
            $prompt .= " [$default]";
        }
        $prompt .= ": ";
        
        echo $prompt;
        $answer = trim(fgets(STDIN));
        
        return $answer === '' ? $default : $answer;
    }
    
    private function askSecret($question) {
        echo $question . ": ";
        
        // Masquer la saisie du mot de passe sur Unix
        if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
            system('stty -echo');
            $password = trim(fgets(STDIN));
            system('stty echo');
            echo "\n";
        } else {
            // Sur Windows, on ne peut pas masquer facilement
            $password = trim(fgets(STDIN));
        }
        
        return $password;
    }
    
    private function getEnvValue($key, $default = '') {
        $content = file_get_contents($this->envFile);
        if (preg_match("/^$key=(.*)$/m", $content, $matches)) {
            return trim($matches[1], '"\'');
        }
        return $default;
    }
    
    private function updateEnvValue($key, $value) {
        $content = file_get_contents($this->envFile);
        
        // Échapper les caractères spéciaux
        $value = addslashes($value);
        
        if (preg_match("/^$key=(.*)$/m", $content)) {
            $content = preg_replace("/^$key=(.*)$/m", "$key=$value", $content);
        } else {
            $content .= "\n$key=$value\n";
        }
        
        file_put_contents($this->envFile, $content);
    }
    
    private function loadEnv() {
        $lines = file($this->envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) {
                continue;
            }
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value, '"\''));
        }
    }
    
    private function isInteractive() {
        return php_sapi_name() === 'cli' && defined('STDIN');
    }
    
    private function printSuccess($message) {
        echo "\033[32m$message\033[0m\n";
    }
    
    private function printError($message) {
        echo "\033[31m$message\033[0m\n";
    }
    
    private function printWarning($message) {
        echo "\033[33m$message\033[0m\n";
    }
    
    private function printInfo($message) {
        echo "\033[36m$message\033[0m\n";
    }
}

// Exécuter le setup si le script est appelé directement
if (php_sapi_name() === 'cli' && isset($argv[0]) && basename($argv[0]) === 'setup.php') {
    $setup = new HangmanSetup();
    $setup->run();
}
?>