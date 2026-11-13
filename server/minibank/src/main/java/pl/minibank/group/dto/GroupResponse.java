package pl.minibank.group.dto;

import pl.minibank.group.ExpenseGroup;
import pl.minibank.group.GroupMember;

import java.time.Instant;
import java.util.List;

public record GroupResponse(
        Long id,
        String name,
        String description,
        Long createdById,
        List<MemberResponse> members,
        Instant createdAt,
        Instant updatedAt
) {
    public static GroupResponse from(ExpenseGroup group, List<GroupMember> members) {
        List<MemberResponse> memberResponses = members.stream()
                .map(MemberResponse::from)
                .toList();
        return new GroupResponse(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCreatedBy().getId(),
                memberResponses,
                group.getCreatedAt(),
                group.getUpdatedAt()
        );
    }
}
