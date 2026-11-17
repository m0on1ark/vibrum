package pl.minibank.group.dto;

import pl.minibank.group.GroupMember;
import pl.minibank.user.User;

import java.time.Instant;

public record MemberResponse(
        Long userId,
        String email,
        String displayName,
        Instant joinedAt
) {
    public static MemberResponse from(GroupMember member) {
        User user = member.getUser();
        return new MemberResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                member.getJoinedAt()
        );
    }
}
