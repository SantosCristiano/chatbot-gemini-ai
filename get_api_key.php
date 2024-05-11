<?php
$envFile = '.env';
if (file_exists($envFile)) {
    // Ler o conteúdo do arquivo .env
    $envContent = file_get_contents($envFile);
    // Remover espaços em branco e quebras de linha
    $envContent = trim($envContent);
    // Retornar o conteúdo como resposta
    echo $envContent;
} else {
    http_response_code(404); // Arquivo não encontrado
}
?>