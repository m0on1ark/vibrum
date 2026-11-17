package pl.minibank.group;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.minibank.group.dto.BalanceResponse;
import pl.minibank.group.dto.TransferResponse;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final GroupService groupService;
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
}
