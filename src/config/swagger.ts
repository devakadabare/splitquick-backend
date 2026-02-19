import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Sharing Application API',
      version: '1.0.0',
      description: 'A comprehensive API for managing shared expenses, groups, and settlements',
      contact: {
        name: 'API Support',
        email: 'support@expense-app.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.expense-app.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'strongPassword123',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'strongPassword123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Weekend Trip',
            },
            currency: {
              type: 'string',
              example: 'USD',
            },
            createdBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        CreateGroupRequest: {
          type: 'object',
          required: ['name', 'currency'],
          properties: {
            name: {
              type: 'string',
              example: 'Weekend Trip',
            },
            currency: {
              type: 'string',
              example: 'USD',
            },
          },
        },
        GroupMember: {
          type: 'object',
          properties: {
            groupId: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            role: {
              type: 'string',
              enum: ['admin', 'member'],
              example: 'member',
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
            },
            isGuest: {
              type: 'boolean',
              example: false,
            },
            guestEmail: {
              type: 'string',
              format: 'email',
              nullable: true,
            },
          },
        },
        AddMemberRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'member@example.com',
            },
          },
        },
        UpdateRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: {
              type: 'string',
              enum: ['admin', 'member'],
              example: 'admin',
            },
          },
        },
        Expense: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            groupId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              example: 'Dinner at Restaurant',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 150.50,
            },
            paidBy: {
              type: 'string',
              format: 'uuid',
            },
            splitMethod: {
              type: 'string',
              enum: ['equal', 'percentage', 'custom'],
              example: 'equal',
            },
            category: {
              type: 'string',
              nullable: true,
              example: 'Food',
            },
            note: {
              type: 'string',
              nullable: true,
              example: 'Italian restaurant',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            deletedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        ExpenseSplit: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 50.17,
            },
            percentage: {
              type: 'number',
              format: 'decimal',
              nullable: true,
              example: 33.33,
            },
          },
        },
        CreateExpenseRequest: {
          type: 'object',
          required: ['groupId', 'amount', 'paidBy', 'splitMethod', 'splits'],
          properties: {
            groupId: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              example: 'Dinner',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 150.50,
            },
            paidBy: {
              type: 'string',
              format: 'uuid',
            },
            splitMethod: {
              type: 'string',
              enum: ['equal', 'percentage', 'custom'],
              example: 'equal',
            },
            category: {
              type: 'string',
              example: 'Food',
            },
            note: {
              type: 'string',
              example: 'Italian restaurant',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            splits: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ExpenseSplit',
              },
            },
          },
        },
        UpdateExpenseRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
            },
            amount: {
              type: 'number',
              format: 'decimal',
            },
            category: {
              type: 'string',
            },
            note: {
              type: 'string',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Balance: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
            },
            userName: {
              type: 'string',
              example: 'John Doe',
            },
            balance: {
              type: 'number',
              format: 'decimal',
              example: -25.50,
              description: 'Positive means owed to them, negative means they owe',
            },
          },
        },
        Settlement: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            groupId: {
              type: 'string',
              format: 'uuid',
            },
            fromUserId: {
              type: 'string',
              format: 'uuid',
            },
            toUserId: {
              type: 'string',
              format: 'uuid',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 50.00,
            },
            note: {
              type: 'string',
              nullable: true,
              example: 'Payment via Cash',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed'],
              example: 'pending',
            },
            recordedBy: {
              type: 'string',
              format: 'uuid',
            },
            recordedAt: {
              type: 'string',
              format: 'date-time',
            },
            confirmedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        SimplifiedSettlement: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              format: 'uuid',
            },
            fromName: {
              type: 'string',
              example: 'John Doe',
            },
            to: {
              type: 'string',
              format: 'uuid',
            },
            toName: {
              type: 'string',
              example: 'Jane Smith',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 50.00,
            },
          },
        },
        RecordSettlementRequest: {
          type: 'object',
          required: ['groupId', 'fromUserId', 'toUserId', 'amount'],
          properties: {
            groupId: {
              type: 'string',
              format: 'uuid',
            },
            fromUserId: {
              type: 'string',
              format: 'uuid',
            },
            toUserId: {
              type: 'string',
              format: 'uuid',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              example: 50.00,
            },
            note: {
              type: 'string',
              example: 'Payment via Cash',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/swagger/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
