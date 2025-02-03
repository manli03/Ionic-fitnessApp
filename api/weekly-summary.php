<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Log errors to a specific file
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/fitness-app/php-error.log');

// Database connection
$host = 'fitnessdb.c164wauwwl3z.ap-southeast-1.rds.amazonaws.com';
$db = 'fitness_tracker';
$user = 'admin';
$pass = 'Fitness_Appa232';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=3306;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

$userId = $_GET['user_id'] ?? 0;

// Query to get calories burned for each of the last 7 days
$query = "SELECT DATE(date) as date, SUM(calories_burned) as caloriesBurned 
          FROM exercises 
          WHERE user_id = :user_id AND DATE(date) >= CURDATE() - INTERVAL 6 DAY 
          GROUP BY DATE(date)";
$stmt = $pdo->prepare($query);
$stmt->execute(['user_id' => $userId]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Initialize array with zeroes for the last 7 days
$caloriesBurned = array_fill(0, 7, 0);

// Map the results to the appropriate day of the week
foreach ($result as $row) {
    $date = new DateTime($row['date']);
    $dayIndex = (int)$date->format('N') - 1;  // 'N' gives 1 (Monday) to 7 (Sunday), adjusting to 0-based index
    $caloriesBurned[$dayIndex] = $row['caloriesBurned'];
}

$response = array(
  "caloriesBurned" => $caloriesBurned
);

echo json_encode($response);
?>
