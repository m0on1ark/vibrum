package pl.minibank.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

    @Query("""
            SELECT m FROM GroupMember m
            JOIN FETCH m.user
            WHERE m.group.id = :groupId
            ORDER BY m.joinedAt
            """)
    List<GroupMember> findAllByGroupIdWithUser(@Param("groupId") Long groupId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
}
