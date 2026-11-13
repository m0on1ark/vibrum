package pl.minibank.group;

import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record GroupMemberId(Long groupId, Long userId) implements Serializable {
}
