package pl.minibank.category;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.category.dto.CategoryRequest;
import pl.minibank.category.dto.CategoryResponse;
import pl.minibank.common.exception.ConflictException;
import pl.minibank.common.exception.ForbiddenException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.user.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Long userId) {
        return categoryRepository.findVisibleTo(userId).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        String name = request.name().trim();
        ensureNameAvailable(userId, name, null);
        Category category = new Category(userRepository.getReferenceById(userId), name, request.type());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest request) {
        Category category = getOwned(userId, categoryId);
        String name = request.name().trim();
        ensureNameAvailable(userId, name, categoryId);
        category.setName(name);
        category.setType(request.type());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long userId, Long categoryId) {
        categoryRepository.delete(getOwned(userId, categoryId));
    }

    @Transactional(readOnly = true)
    public Category getVisible(Long userId, Long categoryId) {
        return categoryRepository.findById(categoryId)
                .filter(category -> category.isVisibleTo(userId))
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }

    private Category getOwned(Long userId, Long categoryId) {
        Category category = getVisible(userId, categoryId);
        if (category.isSystem()) {
            throw new ForbiddenException("System categories cannot be modified");
        }
        return category;
    }

    private void ensureNameAvailable(Long userId, String name, Long excludeId) {
        if (categoryRepository.existsVisibleByName(userId, name, excludeId)) {
            throw new ConflictException("Category with this name already exists");
        }
    }
}
