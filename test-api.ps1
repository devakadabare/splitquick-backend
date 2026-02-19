# Test API Script for Expense Sharing Application (PowerShell)
# Usage: .\test-api.ps1

$BASE_URL = "http://localhost:4000"
$TOKEN = ""
$USER_ID = ""
$GROUP_ID = ""
$EXPENSE_ID = ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Expense Sharing API Test Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check" -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Host "Response: $($response | ConvertTo-Json)"
    if ($response.status -eq "ok") {
        Write-Host "✓ Health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Register User
Write-Host "2. Testing User Registration" -ForegroundColor Blue
try {
    $body = @{
        name = "Test User"
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response: $($response | ConvertTo-Json)"

    $TOKEN = $response.token
    $USER_ID = $response.user.id
    Write-Host "✓ Registration successful" -ForegroundColor Green
    Write-Host "Token: $($TOKEN.Substring(0, [Math]::Min(20, $TOKEN.Length)))..."
    Write-Host "User ID: $USER_ID"
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing User Login" -ForegroundColor Blue
try {
    $body = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Current User
Write-Host "4. Testing Get Current User" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/me" -Method Get -Headers $headers
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✓ Get user successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Get user failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Group
Write-Host "5. Testing Create Group" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $body = @{
        name = "Weekend Trip"
        currency = "USD"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/groups" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Response: $($response | ConvertTo-Json)"

    $GROUP_ID = $response.id
    Write-Host "✓ Group created successfully" -ForegroundColor Green
    Write-Host "Group ID: $GROUP_ID"
} catch {
    Write-Host "✗ Create group failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get User Groups
Write-Host "6. Testing Get User Groups" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/groups" -Method Get -Headers $headers
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✓ Get groups successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Get groups failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Create Expense
Write-Host "7. Testing Create Expense" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $body = @{
        groupId = $GROUP_ID
        title = "Dinner"
        amount = 120.00
        paidBy = $USER_ID
        splitMethod = "equal"
        category = "food"
        splits = @(
            @{ userId = $USER_ID }
        )
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/expenses" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Response: $($response | ConvertTo-Json)"

    $EXPENSE_ID = $response.id
    Write-Host "✓ Expense created successfully" -ForegroundColor Green
    Write-Host "Expense ID: $EXPENSE_ID"
} catch {
    Write-Host "✗ Create expense failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Get Group Expenses
Write-Host "8. Testing Get Group Expenses" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/expenses/group/$GROUP_ID" -Method Get -Headers $headers
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✓ Get expenses successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Get expenses failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Get Balances
Write-Host "9. Testing Get Group Balances" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/expenses/group/$GROUP_ID/balances" -Method Get -Headers $headers
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✓ Get balances successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Get balances failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 10: Get Simplified Settlements
Write-Host "10. Testing Get Simplified Settlements" -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $TOKEN"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/settlements/group/$GROUP_ID/simplified" -Method Get -Headers $headers
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "✓ Get simplified settlements successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Get simplified settlements failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:"
Write-Host "  User ID: $USER_ID"
Write-Host "  Group ID: $GROUP_ID"
Write-Host "  Expense ID: $EXPENSE_ID"
Write-Host ""
Write-Host "You can now test with these IDs or clean up:"
Write-Host "  - Delete expense: DELETE /api/expenses/$EXPENSE_ID"
Write-Host "  - Delete group: DELETE /api/groups/$GROUP_ID"
