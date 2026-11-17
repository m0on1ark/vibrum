package pl.minibank.group.dto;

import pl.minibank.group.ExpenseGroup;

import java.time.Instant;

public record GroupSummaryResponse(
        Long id,
        String name,
        String description,
        Long createdById,
        int memberCount,
        Instant createdAt
) {
    public static GroupSummaryResponse from(ExpenseGroup group, int memberCount) {
        return new GroupSummaryResponse(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCreatedBy().getId(),
                memberCount,
                group.getCreatedAt()
        );
    }
}
