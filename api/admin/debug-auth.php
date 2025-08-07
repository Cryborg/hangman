<?php
/**
 * Debug temporaire pour diagnostiquer le problème auth
 */

// Afficher toutes les erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>🔍 Debug Auth API</h2>";

// 1. Tester l'inclusion de config.php
echo "<h3>1. Test config.php</h3>";
try {
    require_once __DIR__ . '/../config.php';
    echo "✅ config.php chargé<br>";
    
    $constants = ['ADMIN_ENABLED', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'DB_HOST'];
    foreach ($constants as $const) {
        if (defined($const)) {
            echo "✅ $const défini : " . (in_array($const, ['ADMIN_PASSWORD']) ? '[MASQUÉ]' : constant($const)) . "<br>";
        } else {
            echo "❌ $const NON défini<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Erreur config.php : " . $e->getMessage() . "<br>";
}

// 2. Tester la réception JSON
echo "<h3>2. Test réception données POST</h3>";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    echo "Raw input: " . htmlspecialchars($rawInput) . "<br>";
    
    $decoded = json_decode($rawInput, true);
    if ($decoded) {
        echo "✅ JSON décodé : " . print_r($decoded, true) . "<br>";
    } else {
        echo "❌ Erreur JSON : " . json_last_error_msg() . "<br>";
    }
} else {
    echo "Faites une requête POST avec du JSON pour tester<br>";
}

// 3. Tester la classe AdminAuth
echo "<h3>3. Test classe AdminAuth</h3>";
if (class_exists('AdminAuth')) {
    echo "✅ Classe AdminAuth existe<br>";
    
    try {
        $adminEnabled = AdminAuth::isAdminEnabled();
        echo "Admin enabled: " . ($adminEnabled ? 'true' : 'false') . "<br>";
    } catch (Exception $e) {
        echo "❌ Erreur AdminAuth : " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ Classe AdminAuth n'existe pas<br>";
}

// 4. Info serveur
echo "<h3>4. Info serveur</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Document root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script: " . __FILE__ . "<br>";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "<br>";

?>

<script>
// Test depuis JavaScript
fetch('/games/pendu/api/admin/debug-auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({action: 'test'})
})
.then(r => r.text())
.then(data => {
    document.getElementById('js-test').innerHTML = data;
});
</script>

<div id="js-test">
<h3>5. Test depuis JavaScript (se charge...)</h3>
</div>