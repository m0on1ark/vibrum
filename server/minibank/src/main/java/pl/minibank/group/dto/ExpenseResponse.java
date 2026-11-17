package pl.minibank.group.dto;

import pl.minibank.group.SharedExpense;
import pl.minibank.group.SplitMode;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ExpenseResponse(
        Long id,
        Long groupId,
        Long paidById,
        String paidByDisplayName,
        String title,
        BigDecimal amount,
        String currency,
        BigDecimal exchangeRate,
        BigDecimal amountInPln,
        LocalDate expenseDate,
        SplitMode splitMode,
        List<SplitLineResponse> splits,
        Instant createdAt
) {
    public static ExpenseResponse from(SharedExpense expense) {
        List<SplitLineResponse> splitResponses = expense.getSplits().stream()
                .map(SplitLineResponse::from)
                .toList();

        return new ExpenseResponse(
                expense.getId(),
                expense.getGroup().getId(),
                expense.getPaidBy().getId(),
                expense.getPaidBy().getDisplayName(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getCurrency(),
                expense.getExchangeRate(),
                expense.getAmountInPln(),
                expense.getExpenseDate(),
                expense.getSplitMode(),
                splitResponses,
                expense.getCreatedAt()
        );
    }
}
