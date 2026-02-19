"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'All fields required' });
            }
            const result = await authService.register(name, email, password);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }
            const result = await authService.login(email, password);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(401).json({ error: error.message });
        }
    }
    async getMe(req, res) {
        try {
            const userId = req.user.id;
            const user = await authService.getMe(userId);
            return res.status(200).json({ user });
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
