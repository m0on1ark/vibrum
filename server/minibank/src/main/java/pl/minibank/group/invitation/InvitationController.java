package pl.minibank.group.invitation;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.group.invitation.dto.InvitationResponse;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Tag(name = "Group Invitations", description = "Endpoints for viewing, accepting and declining group invitations (Role 3)")
public class InvitationController {

    private final GroupInvitationService invitationService;

    @GetMapping
    @Operation(summary = "List current user's group invitations", description = "Returns all group invitations for the currently authenticated user.")
    public List<InvitationResponse> getUserInvitations(@AuthenticationPrincipal Jwt jwt) {
        return invitationService.getUserInvitations(currentUserId(jwt));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Accept a group invitation", description = "Adds the invited user to group members and sets status to ACCEPTED.")
    public InvitationResponse acceptInvitation(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return invitationService.acceptInvitation(id, currentUserId(jwt));
    }

    @PostMapping("/{id}/decline")
    @Operation(summary = "Decline a group invitation", description = "Declines a pending group invitation and sets status to DECLINED.")
    public InvitationResponse declineInvitation(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return invitationService.declineInvitation(id, currentUserId(jwt));
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
