<?php
/**
 * Stream TvFast – Formulario de contacto
 * Usa PHPMailer via SMTP para garantizar entrega en Hostinger
 * 
 * CONFIGURAR: 
 *   1. Sube PHPMailer al servidor: https://github.com/PHPMailer/PHPMailer
 *      O instala via composer: composer require phpmailer/phpmailer
 *   2. Rellena SMTP_USER y SMTP_PASS con tu cuenta de correo de Hostinger
 */

// Verificar método POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit("Método no permitido");
}

// Recoger y sanitizar datos
$nombre  = htmlspecialchars(trim($_POST['nombre']  ?? ''), ENT_QUOTES, 'UTF-8');
$email   = filter_var(trim($_POST['email']  ?? ''), FILTER_SANITIZE_EMAIL);
$mensaje = htmlspecialchars(trim($_POST['mensaje'] ?? ''), ENT_QUOTES, 'UTF-8');

// Validación básica
if (empty($nombre) || empty($email) || empty($mensaje)) {
    echo "<script>alert('Por favor completa todos los campos.'); window.history.back();</script>";
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "<script>alert('El correo no es válido.'); window.history.back();</script>";
    exit;
}

// ─────────────────────────────────────────────────────────
//  OPCIÓN A: PHPMailer con SMTP (recomendado en Hostinger)
// ─────────────────────────────────────────────────────────
$phpmailer_path = __DIR__ . '/vendor/autoload.php'; // si usas composer
// O ruta manual: $phpmailer_path = __DIR__ . '/PHPMailer/src/PHPMailer.php';

if (file_exists($phpmailer_path)) {
    require $phpmailer_path;

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;

    // ── CONFIGURAR AQUÍ ────────────────────────────
    define('SMTP_HOST',  'smtp.hostinger.com');   // o smtp.gmail.com
    define('SMTP_USER',  'contacto@tvfaststream.com'); // tu correo
    define('SMTP_PASS',  'TU_CONTRASEÑA');             // tu contraseña SMTP
    define('SMTP_PORT',  465);
    define('MAIL_DEST',  'tvfastiptv@gmail.com');       // destino
    // ─────────────────────────────────────────────

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(SMTP_USER, 'Web Stream TvFast');
        $mail->addAddress(MAIL_DEST, 'Stream TvFast');
        $mail->addReplyTo($email, $nombre);

        $mail->Subject = "Nuevo mensaje web – $nombre";
        $mail->Body    = "Nombre: $nombre\nCorreo: $email\n\nMensaje:\n$mensaje";
        $mail->AltBody = $mail->Body;

        $mail->send();
        echo "<script>alert('¡Gracias $nombre! Tu mensaje fue enviado correctamente.'); window.location.href = '/';</script>";

    } catch (Exception $e) {
        error_log("PHPMailer error: " . $mail->ErrorInfo);
        echo "<script>alert('Error al enviar. Contáctanos directamente por WhatsApp.'); window.location.href = '/';</script>";
    }

} else {
    // ─────────────────────────────────────────────────────────
    //  OPCIÓN B: mail() nativo (fallback, puede caer en spam)
    // ─────────────────────────────────────────────────────────
    $destino  = 'tvfastiptv@gmail.com';
    $asunto   = "Nuevo mensaje web – $nombre";
    $cuerpo   = "Nombre: $nombre\nCorreo: $email\n\nMensaje:\n$mensaje";
    $headers  = "From: noreply@tvfaststream.com\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    if (mail($destino, $asunto, $cuerpo, $headers)) {
        echo "<script>alert('¡Gracias! Tu mensaje fue enviado.'); window.location.href = '/';</script>";
    } else {
        echo "<script>alert('Error al enviar. Escríbenos por WhatsApp.'); window.location.href = '/';</script>";
    }
}
?>
