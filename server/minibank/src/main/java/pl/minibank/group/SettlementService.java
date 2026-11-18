package pl.minibank.group;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.common.exception.NotFoundException;
import pl.minibank.group.dto.BalanceResponse;
import pl.minibank.group.dto.PaymentDetailsResponse;
import pl.minibank.group.dto.TransferResponse;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final GroupService groupService;
    private final ExpenseGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final SettlementCalculator calculator = new SettlementCalculator();

    @Transactional(readOnly = true)
    public List<TransferResponse> getSettlements(Long groupId, Long currentUserId) {
        List<BalanceResponse> balances = groupService.getBalances(groupId, currentUserId);

        Map<Long, String> userNames = balances.stream()
                .collect(Collectors.toMap(BalanceResponse::userId, BalanceResponse::displayName));

        List<SettlementCalculator.UserBalance> input = balances.stream()
                .map(b -> new SettlementCalculator.UserBalance(b.userId(), b.netBalance()))
                .toList();

        List<SettlementCalculator.Transfer> transfers = calculator.minimize(input);

        return transfers.stream()
                .map(t -> new TransferResponse(
                        t.fromUserId(),
                        userNames.getOrDefault(t.fromUserId(), "User " + t.fromUserId()),
                        t.toUserId(),
                        userNames.getOrDefault(t.toUserId(), "User " + t.toUserId()),
                        t.amount()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentDetailsResponse getPaymentDetails(Long groupId, Long currentUserId, Long toUserId) {
        TransferResponse transfer = getSettlements(groupId, currentUserId).stream()
                .filter(t -> t.fromUserId().equals(currentUserId) && t.toUserId().equals(toUserId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("You have no payment due to this member"));
        User recipient = userRepository.findById(toUserId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String groupName = groupRepository.findById(groupId)
                .map(ExpenseGroup::getName)
                .orElseThrow(() -> new NotFoundException("Group not found"));

        String title = "Vibrum: " + groupName;
        return new PaymentDetailsResponse(
                recipient.getId(),
                recipient.getDisplayName(),
                recipient.getIban(),
                transfer.amount(),
                "PLN",
                title,
                BankTransferQr.payload(recipient.getIban(), transfer.amount(), recipient.getDisplayName(), title));
    }
}
