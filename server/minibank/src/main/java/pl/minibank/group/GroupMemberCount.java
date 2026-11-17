package pl.minibank.group;

/** Projection: number of members in a group, used to avoid N+1 when listing groups. */
public record GroupMemberCount(Long groupId, Long memberCount) {
}
