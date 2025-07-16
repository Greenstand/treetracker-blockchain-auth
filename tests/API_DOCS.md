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

## 5. Enroll Admin

curl -X POST http://localhost:3000/api/fabric/enroll-admin \
 -H "Content-Type: application/json" \
 -d '{
"userId": "admin",
"secret": "adminpw",
"caUrl": "http://localhost:7054"
}'

## 6. Register and Enroll User with Fabric CA

curl -X POST http://localhost:3000/api/fabric/register-user \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer <access-token>" \
 -d '{
"userId": "new-user-id",
"secret": "user-password",
"affiliation": "org1.department1",
"role": "client"
}'

## 7. et User Identity

curl -X GET "http://localhost:3000/api/fabric/identity/new-user-id" \
 -H "Authorization: Bearer <access-token>"

## 8. Check if User Exists

curl -X GET "http://localhost:3000/api/fabric/user-exists/new-user-id" \
 -H "Authorization: Bearer <access-token>"

## 9. Revoke User

curl -X POST http://localhost:3000/api/fabric/revoke-user \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer <access-token>" \
 -d '{
"userId": "user-to-revoke",
"reason": "keycompromise"
}'

## 10. List All Identities

curl -X GET http://localhost:3000/api/fabric/identities \
 -H "Authorization: Bearer <access-token>"

## 11. Export Identity

curl -X GET "http://localhost:3000/api/fabric/export-identity/new-user-id" \
 -H "Authorization: Bearer <access-token>"

## 13. Fabric CA Server Status

curl -X GET http://localhost:3000/api/fabric/health
