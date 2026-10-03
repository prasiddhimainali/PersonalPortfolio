<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$data    = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$name    = trim($data['name']    ?? '');
$email   = trim($data['email']   ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

$errors = [];
if (mb_strlen($name) < 2)                          $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    $errors[] = 'email';
if (mb_strlen($message) < 10)                      $errors[] = 'message';

if ($errors) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid fields', 'fields' => $errors]);
  exit;
}

$to      = 'prasiddhimainali07@gmail.com';
$subject = $subject !== '' ? $subject : "New enquiry from $name";
$body    = "$message\n\n— $name <$email>";
$headers = "From: no-reply@" . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n"
         . "Reply-To: $email\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

if (mail($to, $subject, $body, $headers)) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'Could not send the message.']);
}
