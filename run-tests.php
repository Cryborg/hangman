<?php
/**
 * Script pour exécuter les tests API
 * Usage: php run-tests.php [test-class]
 */

// Configuration
$apiBaseUrl = 'http://localhost:8090';

// Si on est dans un conteneur Docker, utiliser localhost sans port
if (file_exists('/.dockerenv') || getenv('container') !== false) {
    $apiBaseUrl = 'http://localhost';
}

$adminUsername = 'je_suis_admin';
$adminPassword = 'liamambre1013';

// Vérifier que l'API est accessible
echo "🔍 Vérification de l'API...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiBaseUrl . '/api/categories.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "❌ API non accessible à $apiBaseUrl (code: $httpCode)\n";
    echo "Vérifiez que Docker est démarré et que l'API fonctionne.\n";
    exit(1);
}

echo "✅ API accessible à $apiBaseUrl\n\n";

// Lancer PHPUnit
$phpunitPath = './vendor/bin/phpunit';

// Si PHPUnit n'est pas installé localement, utiliser une version globale ou proposer l'installation
if (!file_exists($phpunitPath)) {
    $phpunitPath = 'phpunit';
    
    // Vérifier si PHPUnit est disponible globalement
    exec('which phpunit 2>/dev/null', $output, $returnCode);
    if ($returnCode !== 0) {
        echo "❌ PHPUnit non trouvé.\n";
        echo "Installez PHPUnit avec Composer :\n";
        echo "  composer require --dev phpunit/phpunit\n\n";
        echo "Ou installez globalement :\n";
        echo "  composer global require phpunit/phpunit\n";
        exit(1);
    }
}

// Définir les variables d'environnement
putenv("API_BASE_URL=$apiBaseUrl");
putenv("ADMIN_USERNAME=$adminUsername");
putenv("ADMIN_PASSWORD=$adminPassword");

// Classe de test à exécuter (optionnel)
$testClass = $argv[1] ?? '';

if ($testClass) {
    echo "🧪 Exécution du test: $testClass\n";
    $command = "$phpunitPath tests/{$testClass}.php --display-warnings --colors=always";
} else {
    echo "🧪 Exécution de tous les tests API...\n";
    $command = "$phpunitPath tests/ --display-warnings --colors=always";
}

echo "Commande: $command\n\n";

// Exécuter les tests
passthru($command, $returnCode);

// Résumé
echo "\n" . str_repeat("=", 60) . "\n";
if ($returnCode === 0) {
    echo "✅ Tous les tests sont passés avec succès!\n";
} else {
    echo "❌ Des tests ont échoué (code: $returnCode)\n";
}
echo str_repeat("=", 60) . "\n";

exit($returnCode);
?>