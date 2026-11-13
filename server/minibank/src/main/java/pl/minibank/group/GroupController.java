package pl.minibank.group;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.group.dto.AddMemberRequest;
import pl.minibank.group.dto.BalanceResponse;
import pl.minibank.group.dto.CreateExpenseRequest;
import pl.minibank.group.dto.CreateGroupRequest;
import pl.minibank.group.dto.ExpenseResponse;
import pl.minibank.group.dto.GroupResponse;
import pl.minibank.group.dto.GroupSummaryResponse;
import pl.minibank.group.dto.MemberResponse;
import pl.minibank.group.dto.TransferResponse;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Group Settlements", description = "Endpoints for managing expense groups, shared expenses and settlements (Role 3)")
public class GroupController {

    private final GroupService groupService;
    private final SettlementService settlementService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an expense group", description = "Creates a new expense group with current user as creator and first member.")
    public GroupResponse createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return groupService.createGroup(request, currentUserId(jwt));
    }

    @GetMapping
    @Operation(summary = "List current user's groups", description = "Returns all expense groups where the current user is a member.")
    public List<GroupSummaryResponse> getUserGroups(@AuthenticationPrincipal Jwt jwt) {
        return groupService.getUserGroups(currentUserId(jwt));
    }

    @GetMapping("/{groupId}")
    @Operation(summary = "Get group details", description = "Returns group details including its members. Must be a member of the group.")
    public GroupResponse getGroupDetails(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return groupService.getGroupDetails(groupId, currentUserId(jwt));
    }

    @PostMapping("/{groupId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a member to group", description = "Adds a registered user to the group by email. Caller must be a member.")
    public MemberResponse addMember(
            @PathVariable Long groupId,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return groupService.addMember(groupId, request, currentUserId(jwt));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove a member from group", description = "Creator can remove members, or member can leave on their own.")
    public void removeMember(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        groupService.removeMember(groupId, userId, currentUserId(jwt));
    }

    @PostMapping("/{groupId}/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add shared expense", description = "Creates an expense with EQUAL, PERCENT or FIXED split.")
    public ExpenseResponse addExpense(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return groupService.addExpense(groupId, request, currentUserId(jwt));
    }

    @GetMapping("/{groupId}/expenses")
    @Operation(summary = "List group expenses", description = "Returns all shared expenses in the group with splits.")
    public List<ExpenseResponse> getGroupExpenses(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return groupService.getGroupExpenses(groupId, currentUserId(jwt));
    }

    @GetMapping("/{groupId}/balances")
    @Operation(summary = "Get member balances", description = "Calculates net balance for every member in the group.")
    public List<BalanceResponse> getBalances(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return groupService.getBalances(groupId, currentUserId(jwt));
    }

    @GetMapping("/{groupId}/settlements")
    @Operation(summary = "Get debt settlement plan", description = "Runs greedy transfer minimization algorithm to output optimal settlement plan.")
    public List<TransferResponse> getSettlements(
            @PathVariable Long groupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return settlementService.getSettlements(groupId, currentUserId(jwt));
    }

    @PatchMapping("/expenses/splits/{splitId}/settle")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Mark split as settled", description = "Marks a specific debt split as settled. Caller must be debtor or payer.")
    public void settleSplit(
            @PathVariable Long splitId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        groupService.settleSplit(splitId, currentUserId(jwt));
    }

    private Long currentUserId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
