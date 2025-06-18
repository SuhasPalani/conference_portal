# Conference Portal Backend

A secure and robust backend for a conference management system, built with Flask and MongoDB. This API facilitates user authentication (login, signup, logout), protected access to user dashboards, and lays the groundwork for managing conference-related information.

## Table of Contents

- [Features](https://www.google.com/search?q=%23features)
- [Technologies Used](https://www.google.com/search?q=%23technologies-used)
- [Getting Started](https://www.google.com/search?q=%23getting-started)
  - [Prerequisites](https://www.google.com/search?q=%23prerequisites)
  - [Installation](https://www.google.com/search?q=%23installation)
  - [Configuration](https://www.google.com/search?q=%23configuration)
  - [Running the Application](https://www.google.com/search?q=%23running-the-application)
- [API Endpoints](https://www.google.com/search?q=%23api-endpoints)
  - [Authentication](https://www.google.com/search?q=%23authentication)
  - [User Dashboard](https://www.google.com/search?q=%23user-dashboard)
- [Database Structure](https://www.google.com/search?q=%23database-structure)
- [Error Handling](https://www.google.com/search?q=%23error-handling)
- [Security Considerations](https://www.google.com/search?q=%23security-considerations)
- [Contributing](https://www.google.com/search?q=%23contributing)
- [License](https://www.google.com/search?q=%23license)
- [Contact](https://www.google.com/search?q=%23contact)
- [Acknowledgements](https://www.google.com/search?q=%23acknowledgements)

## Features

- **User Authentication:** Secure user registration, login, and logout with JWT (JSON Web Tokens).
- **Token Blacklisting:** Prevents the reuse of invalidated JWTs (e.g., after logout).
- **Protected Routes:** API endpoints requiring valid authentication tokens.
- **User Dashboard:** A basic authenticated dashboard displaying user-specific information and conference details.
- **CORS Support:** Configured to handle Cross-Origin Resource Sharing for frontend integration.
- **MongoDB Integration:** Uses PyMongo for database interactions.

## Technologies Used

- **Python:** Programming language.
- **Flask:** Web framework for building the API.
- **PyMongo:** Python driver for MongoDB.
- **PyJWT:** For handling JSON Web Tokens.
- **Flask-CORS:** For handling Cross-Origin Resource Sharing.
- **MongoDB:** NoSQL database for storing user data and other conference information.
- **Werkzeug (Password Hashing):** Used internally by Flask for secure password hashing.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+**
- **pip** (Python package installer)
- **MongoDB Community Server** (running locally or accessible via a connection string)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone [Your Repository URL]
    cd conference-portal/backend # Or wherever your backend code is located
    ```

2.  **Create a virtual environment:**
    It's highly recommended to use a virtual environment to manage dependencies.

    ```bash
    python -m venv buddhi # Or your preferred virtual environment name
    ```

3.  **Activate the virtual environment:**

    - **On Windows:**
      ```bash
      buddhi\Scripts\activate
      ```
    - **On macOS/Linux:**
      ```bash
      source buddhi/bin/activate
      ```

4.  **Install the required Python packages:**

        ```bash
        pip install -r requirements.txt
        ```

        If you don't have a `requirements.txt` file yet, you can create one by running:

        ```bash
        pip freeze > requirements.txt
        ```

        *Make sure the `requirements.txt` contains at least:*

        ```

    Flask==2.3.2
    Flask-PyMongo==2.3.0
    PyJWT==2.8.0
    Werkzeug==2.3.7
    python-dotenv==1.0.0
    pymongo==4.5.0
    requests==2.31.0
    Flask-Cors==3.0.10

        ```

### Configuration

Create a `.env` file in your `backend` directory (or the root of your Flask app) and add the following environment variables:

```
SECRET_KEY=[A_VERY_LONG_RANDOM_STRING_FOR_JWT_SIGNING]
MONGO_URI=mongodb://localhost:27017/conference_db # Your MongoDB connection string
```

- **`SECRET_KEY`**: Generate a strong, random string. You can generate one using Python:
  ```python
  import os
  print(os.urandom(24).hex())
  ```
- **`MONGO_URI`**: Update this if your MongoDB instance is not running on `localhost:27017` or if your database name is different.

### Running the Application

1.  **Ensure your virtual environment is activated.**

2.  **Navigate to your backend directory.**

3.  **Set the Flask application:**

    - **On Windows:**
      ```bash
      set FLASK_APP=app.py # Or your main Flask application file
      ```
    - **On macOS/Linux:**
      ```bash
      export FLASK_APP=app.py
      ```

    _(Assuming your main Flask app instance is in `app.py`)_

4.  **Run the Flask development server:**

    ```bash
    flask run
    ```

    The application will typically run on `http://127.0.0.1:5000/`.

## API Endpoints

### Authentication

- **`POST /api/signup`**

  - **Description:** Registers a new user.
  - **Request Body (JSON):**
    ```json
    {
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "password": "strongpassword123"
    }
    ```
  - **Response (JSON):**
    ```json
    {
      "message": "User registered successfully!",
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
    ```
    or error message.

- **`POST /api/login`**

  - **Description:** Authenticates a user and issues a JWT.
  - **Request Body (JSON):**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "strongpassword123"
    }
    ```
  - **Response (JSON):**
    ```json
    {
      "message": "Login successful!",
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": "60c72b1f9b1d8f001c8e7e1f",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "role": "attendee"
      }
    }
    ```
    or error message.

- **`POST /api/logout`**

  - **Description:** Invalidates the current JWT, requiring the user to log in again.
  - **Headers:** `Authorization: Bearer <your_jwt_token>`
  - **Response (JSON):**
    ```json
    {
      "message": "Successfully logged out."
    }
    ```

### User Dashboard

- **`GET /api/dashboard`**
  - **Description:** Retrieves user-specific and general conference information for authenticated users.
  - **Headers:** `Authorization: Bearer <your_jwt_token>`
  - **Response (JSON):**
    ```json
    {
      "message": "Welcome to your dashboard, [User Full Name]!",
      "user": {
        "id": "60c72b1f9b1d8f001c8e7e1f",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "role": "attendee"
      },
      "conferenceInfo": {
        "title": "AI Conference 2025: Shaping the Future",
        "date": "October 26-28, 2025",
        "location": "Virtual & Chicago, IL",
        "description": "Join leading experts in Artificial Intelligence to explore the latest advancements, research, and applications across various domains.",
        "tracks": [
          "Machine Learning",
          "Deep Learning",
          "Natural Language Processing",
          "Computer Vision",
          "AI Ethics"
        ],
        "participationTimelines": "Registration: Sep 1 - Oct 15 | Abstract Submission: Jul 1 - Aug 31 | Speaker Announcements: Sep 20"
      }
    }
    ```
    or `401 Unauthorized` if token is missing/invalid/expired.

## Database Structure

The application uses MongoDB.
Key collections include:

- **`users`**: Stores user details including `full_name`, `email`, `password_hash`, `role`, and `_id`.
- **`blacklist_tokens`**: Stores invalidated JWT tokens to prevent reuse. Each document contains `token` and `blacklisted_on` fields.

## Error Handling

The API provides informative JSON responses for errors, including:

- `400 Bad Request`: For invalid input (e.g., missing fields in request body).
- `401 Unauthorized`: For missing, invalid, expired, or blacklisted JWT tokens.
- `409 Conflict`: For resource conflicts (e.g., attempting to register with an already existing email).
- `500 Internal Server Error`: For unexpected server-side issues.

## Security Considerations

- **JWT Security:** Tokens are signed with a strong `SECRET_KEY`. Token expiration and blacklisting are implemented.
- **Password Hashing:** User passwords are not stored in plain text; they are hashed using secure algorithms (handled by Werkzeug).
- **CORS:** Configured to allow specific origins or all origins (for development) to prevent cross-origin issues. Ensure this is locked down in production.
- **Environment Variables:** Sensitive information like `SECRET_KEY` and `MONGO_URI` are loaded from environment variables (e.g., `.env` file) and should not be hardcoded in the codebase.

## Contributing

Contributions are welcome\! If you find a bug or have a feature request, please open an issue.

To contribute code:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and ensure tests pass (if any).
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to your branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.
