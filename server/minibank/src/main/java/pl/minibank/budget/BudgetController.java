package pl.minibank.budget;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.budget.dto.BudgetResponse;
import pl.minibank.budget.dto.BudgetSummaryResponse;
import pl.minibank.budget.dto.CreateBudgetRequest;
import pl.minibank.budget.dto.UpdateBudgetRequest;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Endpoints for category spending limits and Burn Rate forecasting (Role 3)")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create budget limit", description = "Sets monthly spending limit for a specific category.")
    public BudgetResponse createBudget(
            @Valid @RequestBody CreateBudgetRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return budgetService.createBudget(request, currentUserId(jwt));
    }

    @GetMapping
    @Operation(summary = "List budgets", description = "Returns budgets for the given month (defaults to current month).")
    public List<BudgetResponse> getBudgets(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return budgetService.getBudgets(currentUserId(jwt), month);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get budget details", description = "Returns budget details by id.")
    public BudgetResponse getBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return budgetService.getBudgetDetails(id, currentUserId(jwt));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update budget limit", description = "Updates spending limit for an existing budget.")
    public BudgetResponse updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBudgetRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return budgetService.updateBudget(id, request, currentUserId(jwt));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete budget", description = "Deletes a budget by id.")
    public void deleteBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        budgetService.deleteBudget(id, currentUserId(jwt));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get budget summary & Burn Rate forecast", description = "Calculates spent amount, projected month-end burn rate and status (OK, WARNING, EXCEEDED) for each category.")
    public List<BudgetSummaryResponse> getBudgetSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return budgetService.getBudgetSummaries(currentUserId(jwt), month);
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
