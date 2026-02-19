"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifySettlements = simplifySettlements;
exports.calculateNetBalances = calculateNetBalances;
exports.validateSettlements = validateSettlements;
exports.formatSettlements = formatSettlements;
/**
 * Settlement Simplification Algorithm
 *
 * Uses a greedy approach to minimize the number of transactions needed
 * to settle all debts within a group.
 *
 * Algorithm:
 * 1. Calculate net balance for each person (amount owed - amount owing)
 * 2. Separate into creditors (positive balance) and debtors (negative balance)
 * 3. Sort both lists by absolute amount (descending)
 * 4. Repeatedly match largest creditor with largest debtor
 * 5. Continue until all balances are settled
 *
 * Time Complexity: O(n log n) due to sorting
 * Space Complexity: O(n)
 *
 * Example:
 * Input: A owes 100, B is owed 60, C is owed 40
 * Output: A pays B 60, A pays C 40 (2 transactions instead of potentially more)
 */
function simplifySettlements(balances) {
    const transactions = [];
    // Separate creditors (owed money) and debtors (owe money)
    const creditors = [];
    const debtors = [];
    balances.forEach(balance => {
        if (balance.amount > 0.01) {
            creditors.push({ ...balance });
        }
        else if (balance.amount < -0.01) {
            debtors.push({ ...balance, amount: Math.abs(balance.amount) });
        }
    });
    // Sort by amount descending (largest first)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    let i = 0; // creditor index
    let j = 0; // debtor index
    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
        // Determine transaction amount (minimum of what debtor owes and creditor is owed)
        const transactionAmount = Math.min(creditor.amount, debtor.amount);
        // Record transaction
        transactions.push({
            from: debtor.userId,
            fromName: debtor.name,
            to: creditor.userId,
            toName: creditor.name,
            amount: Math.round(transactionAmount * 100) / 100 // Round to 2 decimals
        });
        // Update balances
        creditor.amount -= transactionAmount;
        debtor.amount -= transactionAmount;
        // Move to next creditor if current one is fully paid
        if (creditor.amount < 0.01) {
            i++;
        }
        // Move to next debtor if current one has fully paid
        if (debtor.amount < 0.01) {
            j++;
        }
    }
    return transactions;
}
/**
 * Calculate net balances from raw balance data
 *
 * @param balances Array of balances with positive (owed) and negative (owes) amounts
 * @returns Sorted array of net balances
 */
function calculateNetBalances(balances) {
    return balances
        .filter(b => Math.abs(b.amount) > 0.01) // Filter out settled balances
        .sort((a, b) => b.amount - a.amount); // Sort by amount descending
}
/**
 * Validate that simplified settlements actually settle all debts
 *
 * @param originalBalances Original balances before simplification
 * @param transactions Simplified transactions
 * @returns true if settlements balance out correctly
 */
function validateSettlements(originalBalances, transactions) {
    const balanceCheck = {};
    // Initialize balance check
    originalBalances.forEach(b => {
        balanceCheck[b.userId] = b.amount;
    });
    // Apply transactions
    transactions.forEach(t => {
        balanceCheck[t.from] = (balanceCheck[t.from] || 0) + t.amount;
        balanceCheck[t.to] = (balanceCheck[t.to] || 0) - t.amount;
    });
    // Check if all balances are settled (within rounding tolerance)
    return Object.values(balanceCheck).every(balance => Math.abs(balance) < 0.01);
}
/**
 * Format simplified settlements for display
 *
 * @param transactions Array of settlement transactions
 * @returns Formatted string array for display
 */
function formatSettlements(transactions) {
    return transactions.map(t => `${t.fromName} pays ${t.toName} $${t.amount.toFixed(2)}`);
}
