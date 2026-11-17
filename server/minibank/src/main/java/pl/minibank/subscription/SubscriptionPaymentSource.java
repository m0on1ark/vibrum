package pl.minibank.subscription;

import java.util.List;

public interface SubscriptionPaymentSource {

    List<PaymentRecord> findPayments(Long userId);
}
