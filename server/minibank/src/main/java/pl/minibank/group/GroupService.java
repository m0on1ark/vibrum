package pl.minibank.group;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.common.exception.BadRequestException;
import pl.minibank.common.exception.ConflictException;
import pl.minibank.common.exception.ForbiddenException;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.currency.service.NbpCurrencyService;
import pl.minibank.group.dto.AddMemberRequest;
import pl.minibank.group.dto.BalanceResponse;
import pl.minibank.group.dto.CreateExpenseRequest;
import pl.minibank.group.dto.CreateGroupRequest;
import pl.minibank.group.dto.ExpenseResponse;
import pl.minibank.group.dto.GroupResponse;
import pl.minibank.group.dto.GroupSummaryResponse;
import pl.minibank.group.dto.MemberResponse;
import pl.minibank.group.dto.SplitEntryRequest;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final ExpenseGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final SharedExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final UserRepository userRepository;
    private final NbpCurrencyService nbpCurrencyService;
    private final SplitCalculator splitCalculator = new SplitCalculator();

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, Long currentUserId) {
        User creator = getUserOrThrow(currentUserId);
        String description = request.description() != null ? request.description().trim() : null;
        ExpenseGroup group = new ExpenseGroup(request.name().trim(), description, creator);
        group = groupRepository.save(group);

        GroupMember creatorMember = new GroupMember(group, creator);
        memberRepository.save(creatorMember);

        return GroupResponse.from(group, List.of(creatorMember));
    }

    @Transactional(readOnly = true)
    public List<GroupSummaryResponse> getUserGroups(Long currentUserId) {
        List<ExpenseGroup> groups = groupRepository.findAllByMemberUserId(currentUserId);
        if (groups.isEmpty()) {
            return List.of();
        }

        // One aggregate query for all groups instead of one query per group (N+1)
        List<Long> groupIds = groups.stream().map(ExpenseGroup::getId).toList();
        Map<Long, Long> memberCounts = memberRepository.countMembersByGroupIds(groupIds).stream()
                .collect(Collectors.toMap(GroupMemberCount::groupId, GroupMemberCount::memberCount));

        return groups.stream()
                .map(group -> GroupSummaryResponse.from(
                        group, memberCounts.getOrDefault(group.getId(), 0L).intValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupDetails(Long groupId, Long currentUserId) {
        ensureMembership(groupId, currentUserId);
        ExpenseGroup group = groupRepository.findByIdWithCreator(groupId)
                .orElseThrow(() -> new NotFoundException("Expense group not found with id: " + groupId));
        List<GroupMember> members = memberRepository.findAllByGroupIdWithUser(groupId);
        return GroupResponse.from(group, members);
    }

    @Transactional
    public MemberResponse addMember(Long groupId, AddMemberRequest request, Long currentUserId) {
        ensureMembership(groupId, currentUserId);
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Expense group not found with id: " + groupId));

        if (!group.getCreatedBy().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the group creator can directly add members");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User userToAdd = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User with email " + request.email() + " not found"));

        if (memberRepository.existsByGroupIdAndUserId(groupId, userToAdd.getId())) {
            throw new ConflictException("User is already a member of this group");
        }

        GroupMember newMember = new GroupMember(group, userToAdd);
        newMember = memberRepository.save(newMember);

        return MemberResponse.from(newMember);
    }

    @Transactional
    public void removeMember(Long groupId, Long targetUserId, Long currentUserId) {
        ensureMembership(groupId, currentUserId);
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Expense group not found with id: " + groupId));

        if (group.getCreatedBy().getId().equals(targetUserId)) {
            throw new ConflictException("Cannot remove the creator of the group");
        }

        // Only group creator can remove other members, or user can remove themselves
        if (!currentUserId.equals(targetUserId) && !group.getCreatedBy().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the group creator can remove other members");
        }

        GroupMemberId memberId = new GroupMemberId(groupId, targetUserId);
        if (!memberRepository.existsById(memberId)) {
            throw new NotFoundException("Member not found in this group");
        }

        // Check unsettled balance for target member
        List<BalanceResponse> balances = getBalances(groupId, currentUserId);
        BigDecimal targetBalance = balances.stream()
                .filter(b -> b.userId().equals(targetUserId))
                .map(BalanceResponse::netBalance)
                .findFirst()
                .orElse(BigDecimal.ZERO);

        if (targetBalance.compareTo(BigDecimal.ZERO) != 0) {
            throw new ConflictException("Member has unsettled balance");
        }

        memberRepository.deleteById(memberId);
    }

    @Transactional
    public ExpenseResponse addExpense(Long groupId, CreateExpenseRequest request, Long currentUserId) {
        ensureMembership(groupId, currentUserId);
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Expense group not found with id: " + groupId));

        List<GroupMember> members = memberRepository.findAllByGroupIdWithUser(groupId);
        Map<Long, User> memberUsers = members.stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), GroupMember::getUser));

        // Determine payer: explicit paidByUserId or default to current user
        Long payerId = request.paidByUserId() != null ? request.paidByUserId() : currentUserId;
        if (!memberUsers.containsKey(payerId)) {
            throw new InvalidSplitException("Payer is not a member of this group");
        }
        User payer = memberUsers.get(payerId);

        // Determine currency and exchange rate to PLN
        String currency = (request.currency() != null && !request.currency().isBlank())
                ? request.currency().trim().toUpperCase(Locale.ROOT)
                : "PLN";

        BigDecimal exchangeRate = nbpCurrencyService.getExchangeRateToPln(currency, request.expenseDate());
        BigDecimal amountInPln = request.amount().multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);

        SharedExpense expense = new SharedExpense(
                group,
                payer,
                request.title().trim(),
                request.amount(),
                currency,
                request.expenseDate(),
                request.splitMode(),
                exchangeRate,
                amountInPln
        );

        List<SplitCalculator.SplitResult> calculatedSplits = calculateSplits(request, memberUsers);

        // Calculate PLN share for each split, distributing any penny rounding difference to the first split
        List<BigDecimal> plnShares = new ArrayList<>();
        BigDecimal sumPlnShares = BigDecimal.ZERO;
        for (SplitCalculator.SplitResult splitResult : calculatedSplits) {
            BigDecimal plnShare = splitResult.shareAmount().multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
            plnShares.add(plnShare);
            sumPlnShares = sumPlnShares.add(plnShare);
        }

        BigDecimal diff = amountInPln.subtract(sumPlnShares);
        if (diff.compareTo(BigDecimal.ZERO) != 0 && !plnShares.isEmpty()) {
            plnShares.set(0, plnShares.get(0).add(diff));
        }

        for (int i = 0; i < calculatedSplits.size(); i++) {
            SplitCalculator.SplitResult splitResult = calculatedSplits.get(i);
            BigDecimal shareAmountInPln = plnShares.get(i);
            User splitUser = memberUsers.get(splitResult.userId());
            ExpenseSplit split = new ExpenseSplit(
                    expense,
                    splitUser,
                    splitResult.shareAmount(),
                    splitResult.sharePercent(),
                    shareAmountInPln
            );
            expense.addSplit(split);
        }

        SharedExpense savedExpense = expenseRepository.save(expense);
        return ExpenseResponse.from(savedExpense);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getGroupExpenses(Long groupId, Long currentUserId) {
        ensureMembership(groupId, currentUserId);
        List<SharedExpense> expenses = expenseRepository.findAllByGroupIdWithSplits(groupId);
        return expenses.stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BalanceResponse> getBalances(Long groupId, Long currentUserId) {
        ensureMembership(groupId, currentUserId);
        List<GroupMember> members = memberRepository.findAllByGroupIdWithUser(groupId);
        List<SharedExpense> expenses = expenseRepository.findAllByGroupIdWithSplits(groupId);

        Map<Long, BigDecimal> netBalances = new HashMap<>();
        for (GroupMember m : members) {
            netBalances.put(m.getUser().getId(), BigDecimal.ZERO);
        }

        for (SharedExpense expense : expenses) {
            for (ExpenseSplit split : expense.getSplits()) {
                if (!split.isSettled()) {
                    Long debtorId = split.getUser().getId();
                    Long creditorId = expense.getPaidBy().getId();

                    netBalances.merge(debtorId, split.getShareAmountInPln().negate(), BigDecimal::add);
                    netBalances.merge(creditorId, split.getShareAmountInPln(), BigDecimal::add);
                }
            }
        }

        return members.stream()
                .map(m -> {
                    User user = m.getUser();
                    BigDecimal balance = netBalances.getOrDefault(user.getId(), BigDecimal.ZERO);
                    return new BalanceResponse(user.getId(), user.getDisplayName(), user.getEmail(), balance);
                })
                .toList();
    }

    @Transactional
    public void settleSplit(Long splitId, Long currentUserId) {
        ExpenseSplit split = splitRepository.findById(splitId)
                .orElseThrow(() -> new NotFoundException("Expense split not found with id: " + splitId));

        SharedExpense expense = split.getExpense();
        ensureMembership(expense.getGroup().getId(), currentUserId);

        Long debtorId = split.getUser().getId();
        Long payerId = expense.getPaidBy().getId();

        if (!currentUserId.equals(debtorId) && !currentUserId.equals(payerId)) {
            throw new ForbiddenException("Only the payer or debtor can settle this split");
        }

        split.markSettled();
    }

    public void ensureMembership(Long groupId, Long userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new NotFoundException("Expense group not found with id: " + groupId);
        }
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));
    }

    private List<SplitCalculator.SplitResult> calculateSplits(
            CreateExpenseRequest request,
            Map<Long, User> memberUsers
    ) {
        return switch (request.splitMode()) {
            case EQUAL -> {
                List<Long> memberIds;
                if (request.splits() != null && !request.splits().isEmpty()) {
                    validateSplitUsers(request.splits(), memberUsers);
                    memberIds = request.splits().stream().map(SplitEntryRequest::userId).toList();
                } else {
                    memberIds = new ArrayList<>(memberUsers.keySet());
                }
                yield splitCalculator.equal(request.amount(), memberIds);
            }
            case PERCENT -> {
                if (request.splits() == null || request.splits().isEmpty()) {
                    throw new InvalidSplitException("Splits must be provided for PERCENT mode");
                }
                validateSplitUsers(request.splits(), memberUsers);
                List<SplitCalculator.SplitEntry> entries = request.splits().stream()
                        .map(s -> new SplitCalculator.SplitEntry(s.userId(), s.percent(), null))
                        .toList();
                yield splitCalculator.percent(request.amount(), entries);
            }
            case FIXED -> {
                if (request.splits() == null || request.splits().isEmpty()) {
                    throw new InvalidSplitException("Splits must be provided for FIXED mode");
                }
                validateSplitUsers(request.splits(), memberUsers);
                List<SplitCalculator.SplitEntry> entries = request.splits().stream()
                        .map(s -> new SplitCalculator.SplitEntry(s.userId(), null, s.amount()))
                        .toList();
                yield splitCalculator.fixed(request.amount(), entries);
            }
        };
    }

    private void validateSplitUsers(List<SplitEntryRequest> splits, Map<Long, User> memberUsers) {
        for (SplitEntryRequest s : splits) {
            if (!memberUsers.containsKey(s.userId())) {
                throw new InvalidSplitException("User " + s.userId() + " is not a member of this group");
            }
        }
    }
}
