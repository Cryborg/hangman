#!/usr/bin/env php
<?php
/**
 * Script pour lancer les tests avec BDD de test isolée
 * Usage: php run-tests-safe.php
 */

echo "🧪 Préparation de l'environnement de test\n";

// 1. Setup de la base de test
echo "📋 Setup de la base de données de test...\n";
$setupResult = system('php tests/setup-test-db.php', $setupCode);
if ($setupCode !== 0) {
    echo "❌ Erreur lors du setup de la base de test\n";
    exit(1);
}

// 2. Lancer PHPUnit
echo "\n🚀 Lancement des tests PHPUnit...\n";
$testResult = system('./vendor/bin/phpunit --configuration phpunit.xml', $testCode);

// 3. Nettoyer après
echo "\n🧹 Nettoyage...\n";
system('php tests/setup-test-db.php > /dev/null'); // Reset silencieux

echo "\n";
if ($testCode === 0) {
    echo "✅ Tous les tests sont passés !\n";
} else {
    echo "❌ Certains tests ont échoué (code: $testCode)\n";
}

exit($testCode);
?>