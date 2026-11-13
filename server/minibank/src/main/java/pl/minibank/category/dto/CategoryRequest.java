package pl.minibank.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.minibank.category.CategoryType;

public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull CategoryType type
) {
}
