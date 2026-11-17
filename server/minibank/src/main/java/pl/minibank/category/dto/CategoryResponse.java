package pl.minibank.category.dto;

import pl.minibank.category.Category;
import pl.minibank.category.CategoryType;

public record CategoryResponse(Long id, String name, CategoryType type, boolean system) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getType(), category.isSystem());
    }
}
