"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const groups_routes_1 = __importDefault(require("./modules/groups/groups.routes"));
const expenses_routes_1 = __importDefault(require("./modules/expenses/expenses.routes"));
const settlements_routes_1 = __importDefault(require("./modules/settlements/settlements.routes"));
const swagger_1 = require("./config/swagger");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// Swagger Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Expense App API Documentation',
}));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/groups', groups_routes_1.default);
app.use('/api/expenses', expenses_routes_1.default);
app.use('/api/settlements', settlements_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = app;
