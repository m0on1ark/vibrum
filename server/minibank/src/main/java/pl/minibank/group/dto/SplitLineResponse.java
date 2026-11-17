package pl.minibank.group.dto;

import pl.minibank.group.ExpenseSplit;

import java.math.BigDecimal;

public record SplitLineResponse(
        Long splitId,
        Long userId,
        String displayName,
        BigDecimal shareAmount,
        BigDecimal sharePercent,
        BigDecimal shareAmountInPln,
        boolean settled
) {
    public static SplitLineResponse from(ExpenseSplit split) {
        return new SplitLineResponse(
                split.getId(),
                split.getUser().getId(),
                split.getUser().getDisplayName(),
                split.getShareAmount(),
                split.getSharePercent(),
                split.getShareAmountInPln(),
                split.isSettled()
        );
    }
}
