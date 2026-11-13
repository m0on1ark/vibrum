package pl.minibank.group;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Pure greedy algorithm — no Spring, no DB.
 * Reduces the full debt mesh to the minimum number of transfers.
 * Guarantees at most N-1 transfers for N participants.
 */
public class SettlementCalculator {

    private static final int SCALE = 4;

    /**
     * @param balances list of (userId, netBalance):
     *                 positive = creditor (others owe them),
     *                 negative = debtor (they owe others).
     * @return minimal list of transfers that settles all debts.
     */
    public List<Transfer> minimize(List<UserBalance> balances) {
        // max-heap for creditors (highest positive balance first)
        PriorityQueue<UserBalance> creditors = new PriorityQueue<>(
                (a, b) -> b.balance().compareTo(a.balance()));
        // min-heap for debtors (most negative balance first)
        PriorityQueue<UserBalance> debtors = new PriorityQueue<>(
                (a, b) -> a.balance().compareTo(b.balance()));

        for (UserBalance ub : balances) {
            int cmp = ub.balance().compareTo(BigDecimal.ZERO);
            if (cmp > 0) creditors.add(ub);
            else if (cmp < 0) debtors.add(ub);
            // zero balance → skip
        }

        List<Transfer> result = new ArrayList<>();

        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            UserBalance creditor = creditors.poll();
            UserBalance debtor = debtors.poll();

            BigDecimal amount = creditor.balance()
                    .min(debtor.balance().negate())
                    .setScale(SCALE, RoundingMode.HALF_UP);

            result.add(new Transfer(debtor.userId(), creditor.userId(), amount));

            BigDecimal remainingCredit = creditor.balance().subtract(amount);
            BigDecimal remainingDebt = debtor.balance().add(amount);

            if (remainingCredit.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(new UserBalance(creditor.userId(), remainingCredit));
            }
            if (remainingDebt.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(new UserBalance(debtor.userId(), remainingDebt));
            }
        }

        return result;
    }

    public record UserBalance(Long userId, BigDecimal balance) {
    }

    public record Transfer(Long fromUserId, Long toUserId, BigDecimal amount) {
    }
}
