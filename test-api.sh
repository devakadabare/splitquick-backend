#!/bin/bash

# Test API Script for Expense Sharing Application
# Usage: bash test-api.sh

BASE_URL="http://localhost:4000"
TOKEN=""
USER_ID=""
GROUP_ID=""
EXPENSE_ID=""

echo "======================================"
echo "Expense Sharing API Test Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}1. Testing Health Check${NC}"
RESPONSE=$(curl -s "$BASE_URL/health")
echo "Response: $RESPONSE"
if [[ $RESPONSE == *"ok"* ]]; then
    echo -e "${GREEN}✓ Health check passed${NC}\n"
else
    echo -e "${RED}✗ Health check failed${NC}\n"
    exit 1
fi

# Test 2: Register User
echo -e "${BLUE}2. Testing User Registration${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }')
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"token"* ]]; then
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
    echo -e "${GREEN}✓ Registration successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    echo "User ID: $USER_ID"
    echo ""
else
    echo -e "${RED}✗ Registration failed${NC}\n"
fi

# Test 3: Login
echo -e "${BLUE}3. Testing User Login${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"token"* ]]; then
    echo -e "${GREEN}✓ Login successful${NC}\n"
else
    echo -e "${RED}✗ Login failed${NC}\n"
fi

# Test 4: Get Current User
echo -e "${BLUE}4. Testing Get Current User${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"email"* ]]; then
    echo -e "${GREEN}✓ Get user successful${NC}\n"
else
    echo -e "${RED}✗ Get user failed${NC}\n"
fi

# Test 5: Create Group
echo -e "${BLUE}5. Testing Create Group${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend Trip",
    "currency": "USD"
  }')
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"Weekend Trip"* ]]; then
    GROUP_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
    echo -e "${GREEN}✓ Group created successfully${NC}"
    echo "Group ID: $GROUP_ID"
    echo ""
else
    echo -e "${RED}✗ Create group failed${NC}\n"
fi

# Test 6: Get User Groups
echo -e "${BLUE}6. Testing Get User Groups${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/groups" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"Weekend Trip"* ]]; then
    echo -e "${GREEN}✓ Get groups successful${NC}\n"
else
    echo -e "${RED}✗ Get groups failed${NC}\n"
fi

# Test 7: Create Expense
echo -e "${BLUE}7. Testing Create Expense${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/expenses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"title\": \"Dinner\",
    \"amount\": 120.00,
    \"paidBy\": \"$USER_ID\",
    \"splitMethod\": \"equal\",
    \"category\": \"food\",
    \"splits\": [
      { \"userId\": \"$USER_ID\" }
    ]
  }")
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"Dinner"* ]]; then
    EXPENSE_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
    echo -e "${GREEN}✓ Expense created successfully${NC}"
    echo "Expense ID: $EXPENSE_ID"
    echo ""
else
    echo -e "${RED}✗ Create expense failed${NC}\n"
fi

# Test 8: Get Group Expenses
echo -e "${BLUE}8. Testing Get Group Expenses${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/expenses/group/$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"Dinner"* ]]; then
    echo -e "${GREEN}✓ Get expenses successful${NC}\n"
else
    echo -e "${RED}✗ Get expenses failed${NC}\n"
fi

# Test 9: Get Balances
echo -e "${BLUE}9. Testing Get Group Balances${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/expenses/group/$GROUP_ID/balances" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"balances"* ]]; then
    echo -e "${GREEN}✓ Get balances successful${NC}\n"
else
    echo -e "${RED}✗ Get balances failed${NC}\n"
fi

# Test 10: Get Simplified Settlements
echo -e "${BLUE}10. Testing Get Simplified Settlements${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/settlements/group/$GROUP_ID/simplified" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $RESPONSE"

if [[ $RESPONSE == *"simplifiedSettlements"* ]]; then
    echo -e "${GREEN}✓ Get simplified settlements successful${NC}\n"
else
    echo -e "${RED}✗ Get simplified settlements failed${NC}\n"
fi

echo "======================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  User ID: $USER_ID"
echo "  Group ID: $GROUP_ID"
echo "  Expense ID: $EXPENSE_ID"
echo ""
echo "You can now test with these IDs or clean up:"
echo "  - Delete expense: DELETE /api/expenses/$EXPENSE_ID"
echo "  - Delete group: DELETE /api/groups/$GROUP_ID"
