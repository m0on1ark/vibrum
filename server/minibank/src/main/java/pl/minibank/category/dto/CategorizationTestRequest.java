package pl.minibank.category.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public record CategorizationTestRequest(
        @Size(max = 500) String title,
        @Size(max = 500) String counterparty
) {

    @AssertTrue(message = "title or counterparty is required")
    public boolean isNotEmpty() {
        return (title != null && !title.isBlank()) || (counterparty != null && !counterparty.isBlank());
    }
}
