"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../../config/database"));
const jwt_1 = require("../../config/jwt");
const firebase_1 = require("../../config/firebase");
class AuthService {
    async firebaseLogin(firebaseToken) {
        const decodedToken = await firebase_1.firebaseAuth.verifyIdToken(firebaseToken);
        const { email, name, uid } = decodedToken;
        if (!email) {
            throw new Error('Email not available from Firebase');
        }
        let user = await database_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            user = await database_1.default.user.create({
                data: {
                    name: name || email.split('@')[0],
                    email,
                }
            });
        }
        else if (user.isGuest) {
            user = await database_1.default.user.update({
                where: { id: user.id },
                data: { name: name || user.name, isGuest: false }
            });
        }
        const token = (0, jwt_1.generateToken)(user.id, user.email);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        };
    }
    async register(name, email, password) {
        const existingUser = await database_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser && !existingUser.isGuest) {
            throw new Error('User already exists');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        let user;
        if (existingUser && existingUser.isGuest) {
            // Upgrade guest to full user
            user = await database_1.default.user.update({
                where: { id: existingUser.id },
                data: { name, passwordHash, isGuest: false }
            });
        }
        else {
            user = await database_1.default.user.create({
                data: { name, email, passwordHash }
            });
        }
        const token = (0, jwt_1.generateToken)(user.id, user.email);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        };
    }
    async login(email, password) {
        const user = await database_1.default.user.findUnique({
            where: { email }
        });
        if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const token = (0, jwt_1.generateToken)(user.id, user.email);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        };
    }
    async getMe(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }
}
exports.AuthService = AuthService;
