# ClockIn
A clocking system by me

## Installation

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

   If you encounter issues with MUI dependencies, run:
   ```
   npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
   ```

3. Start the development server:
   ```
   npm start
   ```

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file in the backend directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/clockin
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```
   
   Note: The server will automatically find an available port if the specified port is in use.

4. Start the server:
   ```
   npm start
   ```

## Troubleshooting

### Port Handling

The backend server now automatically finds an available port if the specified port is in use. When the server starts, it will display the port it's running on:

```
Server running on port 5000
API available at http://localhost:5000/api
```

If port 5000 is busy, it will automatically try the next port (5001, 5002, etc.) until it finds an available one.

### Mongoose Deprecation Warning

If you see a warning about `strictQuery`, it has been fixed by adding this line to the backend/src/index.js file:

```javascript
mongoose.set('strictQuery', false);
```
