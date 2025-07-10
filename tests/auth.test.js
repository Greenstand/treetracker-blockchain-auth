const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
const { expect } = chai;

describe('Authentication API', () => {
    let testUser;
    let authToken;
    let refreshToken;

    beforeEach(async () => {
        testUser = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'securePassword123',
            firstName: 'Test',
            lastName: 'User'
        };

        await chai.request(app)
            .post('/api/auth/register')
            .send(testUser);
        
        const loginRes = await chai.request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: testUser.password
            });
        
        authToken = loginRes.body.accessToken;
        refreshToken = loginRes.body.refreshToken;
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const newUser = {
                username: `newuser_${Date.now()}`,
                email: `new_${Date.now()}@example.com`,
                password: 'password123',
                firstName: 'New',
                lastName: 'User'
            };

            const res = await chai.request(app)
                .post('/api/auth/register')
                .send(newUser);
            
            expect(res).to.have.status(201);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('userId');
        });

        it('should return 400 for missing required fields', async () => {
            const res = await chai.request(app)
                .post('/api/auth/register')
                .send({ username: 'incomplete' });
            
            expect(res).to.have.status(400);
            expect(res.body).to.have.property('success', false);
        });

        it('should handle duplicate username', async () => {
            const res = await chai.request(app)
                .post('/api/auth/register')
                .send(testUser);
            
            expect([409, 500]).to.include(res.status);
            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        it('should return new access token with valid refresh token', async () => {
            const res = await chai.request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken });
            
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('accessToken').that.is.a('string');
            expect(res.body).to.have.property('refreshToken').that.is.a('string');
        });

        it('should handle invalid refresh token', async () => {
            const res = await chai.request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken: 'invalid.token.here' });
            
            expect([400, 401]).to.include(res.status);
            expect(res.body).to.have.property('success', false);
        });
    });
});