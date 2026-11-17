package pl.minibank.group.invitation.dto;

import pl.minibank.group.invitation.GroupInvitation;
import pl.minibank.group.invitation.GroupInvitationStatus;

import java.time.Instant;

public record InvitationResponse(
        Long id,
        Long groupId,
        String groupName,
        String invitedByDisplayName,
        GroupInvitationStatus status,
        Instant createdAt,
        Instant expiresAt
) {
    public static InvitationResponse from(GroupInvitation invitation) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getGroup().getId(),
                invitation.getGroup().getName(),
                invitation.getInvitedBy().getDisplayName(),
                invitation.getStatus(),
                invitation.getCreatedAt(),
                invitation.getExpiresAt()
        );
    }
}
