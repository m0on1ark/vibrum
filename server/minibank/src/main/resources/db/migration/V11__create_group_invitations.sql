CREATE TABLE group_invitations
(
    id              BIGSERIAL PRIMARY KEY,
    group_id        BIGINT      NOT NULL REFERENCES expense_groups (id) ON DELETE CASCADE,
    invited_user_id BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    invited_by_id   BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    responded_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_group_invitations_pending
    ON group_invitations (group_id, invited_user_id)
    WHERE status = 'PENDING';

CREATE INDEX idx_group_invitations_invited_user_id ON group_invitations (invited_user_id);
CREATE INDEX idx_group_invitations_group_id ON group_invitations (group_id);
