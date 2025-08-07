# Project Pulse - A Next.js Project Management Tool

This is a Next.js starter application built in Firebase Studio. It provides a foundation for a project management tool called "Project Pulse", complete with task tracking, project organization, and AI-powered suggestions.

## Getting Started

To run the application locally, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up your Gemini API Key:**
    This project uses the Google Gemini API for its AI features. To enable them, you need to get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    Once you have your key, open the `.env` file in the root of the project and replace `"YOUR_API_KEY_HERE"` with your actual key:

    ```env
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

3.  **Run the development server:**
    The application consists of a Next.js frontend and a Genkit backend for AI flows. You'll need to run them in separate terminals.

    *   **Terminal 1: Run the Next.js app**
        ```bash
        npm run dev
        ```
        This will start the main application on `http://localhost:9002`.

    *   **Terminal 2: Run the Genkit AI flows**
        ```bash
        npm run genkit:watch
        ```
        This starts the local Genkit server, which your Next.js app will call for AI features.

4.  **Open the application:**
    Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.

## Core Features

*   **Project Management**: Create and delete projects.
*   **Task Dashboard**: A Kanban-style board to manage tasks across different development phases.
*   **Task Management**: Add, edit, and delete tasks with details like priority, status, assignee, and sub-tasks.
*   **AI-Powered Suggestions**: Get intelligent suggestions for stalled or blocked tasks using the Gemini API.
*   **Authentication**: User sign-up and login functionality using Firebase Authentication.
