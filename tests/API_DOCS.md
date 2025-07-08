# Authentication API Endpoints

Base URL: `http://localhost:3000/api/auth`

## 1. Register a New User

curl -X POST http://localhost:3000/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{
"username": "your-username",
"email": "your-email@example.com",
"password": "your-password",
"firstName": "your-first-name",
"lastName": "your-last-name"
}'

## 2. Login

curl -X POST http://localhost:3000/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{
"username": "your-username",
"password": "your-password"
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
