# Authentication API Endpoints

Base URL: `http://localhost:3000/api/auth`

## 1. Register a New User

curl -X POST http://localhost:3000/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{
"username": "testuser2",
"email": "test2@example.com",
"password": "password123",
"firstName": "Test",
"lastName": "User"
}'

## 2. Login

curl -X POST http://localhost:3000/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{
"username": "testuser2",
"password": "password123"
}'

## 3. Refresh Access Token

curl -X POST http://localhost:3000/api/auth/refresh-token \
 -H "Content-Type: application/json" \
 -d '{
"refreshToken": "your-refresh-token"
}'

## 4. Get User Profile

curl -X GET http://localhost:3000/api/auth/profile \
 -H "Authorization: Bearer your-access-token"
