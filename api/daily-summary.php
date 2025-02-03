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

// Fetch the daily calorie goal for the user
$query = "SELECT daily_calorie_goal FROM user_profiles WHERE user_id = :user_id";
$stmt = $pdo->prepare($query);
$stmt->execute(['user_id' => $userId]);
$userProfile = $stmt->fetch();

$dailyCalorieGoal = $userProfile['daily_calorie_goal'] ?? 2000;  // Default to 2000 if not provided

// Calculate calories burned from exercises
$query = "SELECT SUM(calories_burned) as caloriesBurned FROM exercises WHERE user_id = :user_id AND DATE(date) = CURDATE()";
$stmt = $pdo->prepare($query);
$stmt->execute(['user_id' => $userId]);
$resultBurned = $stmt->fetch();

// Calculate calories consumed from meals
$query = "SELECT SUM(calories) as caloriesConsumed FROM meals WHERE user_id = :user_id AND DATE(date) = CURDATE()";
$stmt = $pdo->prepare($query);
$stmt->execute(['user_id' => $userId]);
$resultConsumed = $stmt->fetch();

$caloriesBurned = $resultBurned['caloriesBurned'] ?? 0;
$caloriesConsumed = $resultConsumed['caloriesConsumed'] ?? 0;

$response = [
    "caloriesBurned" => $caloriesBurned,
    "caloriesConsumed" => $caloriesConsumed,
    "remainingCalories" => $dailyCalorieGoal - $caloriesConsumed
];

echo json_encode($response);
?>
