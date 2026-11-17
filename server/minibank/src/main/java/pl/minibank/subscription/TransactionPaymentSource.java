package pl.minibank.subscription;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TransactionPaymentSource implements SubscriptionPaymentSource {

    private static final int HISTORY_MONTHS = 25;

    private final TransactionPaymentRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<PaymentRecord> findPayments(Long userId) {
        return repository.findExpenses(userId, LocalDate.now().minusMonths(HISTORY_MONTHS));
    }
}
