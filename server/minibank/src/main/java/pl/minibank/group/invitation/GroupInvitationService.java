package pl.minibank.group.invitation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.common.exception.ConflictException;
import pl.minibank.common.exception.ForbiddenException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.group.ExpenseGroup;
import pl.minibank.group.ExpenseGroupRepository;
import pl.minibank.group.GroupMember;
import pl.minibank.group.GroupMemberRepository;
import pl.minibank.group.invitation.dto.InvitationResponse;
import pl.minibank.group.invitation.dto.SendInvitationRequest;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class GroupInvitationService {

    private static final Duration DEFAULT_EXPIRATION = Duration.ofDays(7);

    private final ExpenseGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final GroupInvitationMailer mailer;

    @Transactional
    public InvitationResponse createInvitation(Long groupId, SendInvitationRequest request, Long currentUserId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, currentUserId)) {
            throw new NotFoundException("Expense group not found with id: " + groupId);
        }

        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Expense group not found with id: " + groupId));

        User inviter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + currentUserId));

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User invitedUser = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User not found with email: " + request.email()));

        if (memberRepository.existsByGroupIdAndUserId(groupId, invitedUser.getId())) {
            throw new ConflictException("User is already a member of this group");
        }

        if (invitationRepository.existsByGroupIdAndInvitedUserIdAndStatus(groupId, invitedUser.getId(), GroupInvitationStatus.PENDING)) {
            throw new ConflictException("An active invitation already exists for this user in this group");
        }

        Instant expiresAt = Instant.now().plus(DEFAULT_EXPIRATION);
        GroupInvitation invitation = new GroupInvitation(group, invitedUser, inviter, expiresAt);
        invitation = invitationRepository.save(invitation);

        mailer.send(invitedUser.getEmail(), inviter.getDisplayName(), group.getName());

        return InvitationResponse.from(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getUserInvitations(Long currentUserId) {
        return invitationRepository.findAllByInvitedUserIdWithDetails(currentUserId).stream()
                .map(InvitationResponse::from)
                .toList();
    }

    @Transactional
    public InvitationResponse acceptInvitation(Long invitationId, Long currentUserId) {
        GroupInvitation invitation = invitationRepository.findByIdWithDetails(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation not found with id: " + invitationId));

        if (!invitation.getInvitedUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the invited user can accept this invitation");
        }

        Instant now = Instant.now();
        if (invitation.getStatus() != GroupInvitationStatus.PENDING || invitation.isExpired(now)) {
            throw new ConflictException("Invitation is not pending or has expired");
        }

        ExpenseGroup group = invitation.getGroup();
        if (!memberRepository.existsByGroupIdAndUserId(group.getId(), currentUserId)) {
            memberRepository.save(new GroupMember(group, invitation.getInvitedUser()));
        }

        invitation.accept(now);
        return InvitationResponse.from(invitation);
    }

    @Transactional
    public InvitationResponse declineInvitation(Long invitationId, Long currentUserId) {
        GroupInvitation invitation = invitationRepository.findByIdWithDetails(invitationId)
                .orElseThrow(() -> new NotFoundException("Invitation not found with id: " + invitationId));

        if (!invitation.getInvitedUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the invited user can decline this invitation");
        }

        if (invitation.getStatus() != GroupInvitationStatus.PENDING) {
            throw new ConflictException("Invitation is not pending");
        }

        invitation.decline(Instant.now());
        return InvitationResponse.from(invitation);
    }
}
