package pl.minibank.group.invitation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {

    boolean existsByGroupIdAndInvitedUserIdAndStatus(Long groupId, Long invitedUserId, GroupInvitationStatus status);

    Optional<GroupInvitation> findByGroupIdAndInvitedUserIdAndStatus(Long groupId, Long invitedUserId, GroupInvitationStatus status);

    @Query("SELECT gi FROM GroupInvitation gi JOIN FETCH gi.group JOIN FETCH gi.invitedUser JOIN FETCH gi.invitedBy WHERE gi.id = :id")
    Optional<GroupInvitation> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT gi FROM GroupInvitation gi JOIN FETCH gi.group JOIN FETCH gi.invitedBy WHERE gi.invitedUser.id = :userId ORDER BY gi.createdAt DESC")
    List<GroupInvitation> findAllByInvitedUserIdWithDetails(@Param("userId") Long userId);

    @Query("SELECT gi FROM GroupInvitation gi JOIN FETCH gi.group JOIN FETCH gi.invitedUser JOIN FETCH gi.invitedBy WHERE gi.group.id = :groupId ORDER BY gi.createdAt DESC")
    List<GroupInvitation> findAllByGroupIdWithDetails(@Param("groupId") Long groupId);
}
