# YouTube-like Backend System Documentation

## Table of Contents

1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Technologies Used](#4-technologies-used)
5. [API Documentation](#5-api-documentation)




## 1. Introduction

The YouTube-like backend system is a web application designed to mimic the core functionalities of a video-sharing platform. It allows users to upload, view, and interact with videos in a social environment.

## 2. Features

- User authentication and authorization
- Video uploading and playback
- Like, dislike, and comment on videos
- User subscriptions and recommendations
- Search functionality
- Notifications for user activities

## 3. Architecture

The backend system is structured around the Model-View-Controller (MVC) architecture, encompassing various models and controllers to manage distinct aspects of the application. The components include:

### Models(M):

- **User Model:**
  - Manages user data, authentication, and profile information.

- **Video Model:**
  - Responsible for the storage and retrieval of video-related data.

- **Subscription Model:**
  - Handles user subscriptions, keeping track of subscribed channels.

- **Like Model:**
  - Manages user likes on videos, capturing interactions.

- **Comment Model:**
  - Stores user comments associated with videos.

- **Tweet Model:**
  - Handles tweets or short messages within the system.

- **Playlist Model:**
  - Manages user-created playlists for organizing and curating videos.

### View(V):

The View layer is represented by the presentation logic responsible for rendering data to clients. In the context of the backend, this involves formatting and preparing data to be sent as responses.

### Controllers(C):

- **User Controller:**
  - Orchestrates user-related operations, including authentication, profile management, and user-specific actions.

- **Video Controller:**
  - Coordinates video-related operations, managing interactions between users and videos.

- **Subscription Controller:**
  - Handles actions related to user subscriptions, such as subscribing and unsubscribing from channels.

- **Like Controller:**
  - Manages actions related to user likes on videos, allowing users to express appreciation for content.

- **Comment Controller:**
  - Facilitates user interactions through comments on videos, handling creation, retrieval, and moderation.

- **Tweet Controller:**
  - Manages tweets or short messages within the system, enabling users to share concise updates.

- **Playlist Controller:**
  - Handles user-created playlists, allowing users to create, edit, and manage their curated lists of videos.

- **Dashboard Controller:**
  - The Dashboard Controller manages user dashboard activities, offering insights into channel statistics like total video views, subscribers, videos, and likes. It also provides a catalog of all uploaded videos for quick access and management.



This MVC architecture promotes a modular and organized structure, enhancing maintainability and scalability. Each model and controller focuses on specific functionalities, ensuring a clear separation of concerns and facilitating future expansions or updates. Refer to the codebase and relevant documentation for detailed information on the interactions and functions of each component.

## 4. Technologies Used

- **Node.js:** JavaScript runtime environment
- **Express.js:** Web application framework for Node.js
- **MongoDB:** NoSQL database for data storage
- **JWT (JSON Web Tokens):** Token-based authentication for secure communication
- **bcrypt:** Hashing library for password encryption
- **Multer:** Middleware for handling file uploads
- **Cloudinary:** Cloud-based image and video management service

## 5. API Documentation

The YouTube-like backend system provides a RESTful API to interact with various features of the platform. Below is an overview of the available endpoints and their functionalities.

### Base URL

The base URL for all API endpoints is [https://backend-youtube-com.onrender.com](https://backend-youtube-com.onrender.com)


### Authentication

All requests to protected endpoints require authentication through JSON Web Tokens (JWT). Include the token in the `Authorization` header using the `Bearer` scheme.

### Endpoints

#### 1. User-related Endpoints

- **Register a new user:**
  - `POST /api/users/register`
  - Request Body:
    ```json
    {
      "username": "example_user",
      "email": "user@example.com",
      "password": "securepassword"
    }
    ```
  - Response:
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": "user_id",
        "username": "example_user",
        "email": "user@example.com"
      }
    }
    ```

- **User Login:**
  - `POST /api/users/login`
  - Request Body:
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword"
    }
    ```
  - Response:
    ```json
    {
      "token": "jsonwebtoken",
      "user": {
        "id": "user_id",
        "username": "example_user",
        "email": "user@example.com"
      }
    }
    ```

#### 2. Video-related Endpoints

- **Upload a video:**
  - `POST /api/videos/upload`
  - Request Body:
    ```json
    {
      "title": "Example Video",
      "description": "A sample video",
      "file": "video-file",
      "tags": ["tag1", "tag2"]
    }
    ```
  - Response:
    ```json
    {
      "message": "Video uploaded successfully",
      "video": {
        "id": "video_id",
        "title": "Example Video",
        "description": "A sample video",
        "tags": ["tag1", "tag2"],
        "uploader": "user_id"
      }
    }
    ```

- **Get video details:**
  - `GET /api/videos/:videoId`
  - Response:
    ```json
    {
      "id": "video_id",
      "title": "Example Video",
      "description": "A sample video",
      "tags": ["tag1", "tag2"],
      "uploader": "user_id",
      "views": 100,
      "likes": 50,
      "comments": [
        {
          "user": "user_id",
          "comment": "Great video!"
        }
      ]
    }
    ```

#### 3. Subscription-related Endpoints

- **Subscribe to a channel:**
  - `POST /api/subscriptions/subscribe`
  - Request Body:
    ```json
    {
      "channelId": "channel_id"
    }
    ```
  - Response:
    ```json
    {
      "message": "Subscribed to the channel successfully"
    }
    ```

- **Unsubscribe from a channel:**
  - `POST /api/subscriptions/unsubscribe`
  - Request Body:
    ```json
    {
      "channelId": "channel_id"
    }
    ```
  - Response:
    ```json
    {
      "message": "Unsubscribed from the channel successfully"
    }
    ```

### Error Handling

In case of errors, the API will respond with appropriate HTTP status codes and error messages in the response body.

This is a simplified overview. For more detailed information, refer to the codebase and the API documentation provided for each endpoint.
