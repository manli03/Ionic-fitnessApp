# Fitness App

## Description
The Fitness App is a mobile application built with Ionic and Angular, designed to help users track their fitness journey. It includes features for managing exercises, logging meals, viewing daily and weekly summaries, and managing user profiles. The application interacts with a PHP backend for data persistence and authentication.

## Installation

To set up and run this project locally, follow these steps:

### Prerequisites
*   Node.js (LTS version recommended)
*   npm (comes with Node.js)
*   Ionic CLI (`npm install -g @ionic/cli`)
*   Capacitor CLI (`npm install -g @capacitor/cli`)
*   A web server (e.g., Apache, Nginx) with PHP support for the backend.
*   MySQL or a compatible database for the backend.

### Backend Setup (PHP)
1.  **Database**:
    *   Create a new MySQL database.
    *   Import the `database/schema.sql` file into your new database to set up the necessary tables.
2.  **API Files**:
    *   Copy the `auth.php`, `api/daily-summary.php`, and `api/weekly-summary.php` files to your web server's document root or a designated API directory.
    *   Edit these PHP files to configure your database connection details (e.g., database name, username, password).

### Frontend Setup (Ionic/Angular)
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/manli03/Ionic-fitnessApp
    cd fitnessApp
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure API Endpoint**:
    *   Open `src/environments/environment.ts` and `src/environments/environment.prod.ts`.
    *   Update the `apiUrl` variable to point to your PHP backend's URL (e.g., `http://localhost/api/` or `http://your-domain.com/api/`).

## Usage

### Running in Development Mode (Browser)
To run the app in your web browser for development:
```bash
ionic serve
```
This will open the app in your default browser, usually at `http://localhost:8100`.

### Running on a Mobile Device (Android/iOS)

#### Android
1.  **Add Android platform**:
    ```bash
    ionic capacitor add android
    ```
2.  **Build the web assets**:
    ```bash
    ionic build
    ```
3.  **Copy web assets to native project**:
    ```bash
    npx cap sync android
    ```
4.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
    From Android Studio, you can run the app on an emulator or a connected device.

#### iOS (macOS only)
1.  **Add iOS platform**:
    ```bash
    ionic capacitor add ios
    ```
2.  **Build the web assets**:
    ```bash
    ionic build
    ```
3.  **Copy web assets to native project**:
    ```bash
    npx cap sync ios
    ```
4.  **Open Xcode**:
    ```bash
    npx cap open ios
    ```
    From Xcode, you can run the app on a simulator or a connected device.

## Contributing
Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License
This project is licensed under the [Your License Name] - see the LICENSE.md file for details.
