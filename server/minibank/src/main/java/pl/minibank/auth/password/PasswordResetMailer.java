package pl.minibank.auth.password;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
public class PasswordResetMailer {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String publicUrl;
    private final String from;

    public PasswordResetMailer(ObjectProvider<JavaMailSender> mailSender,
                               @Value("${app.public-url}") String publicUrl,
                               @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.publicUrl = publicUrl;
        this.from = from;
    }

    public void send(String email, String rawToken) {
        String link = UriComponentsBuilder.fromUriString(publicUrl)
                .path("/auth/reset-password")
                .queryParam("token", rawToken)
                .toUriString();

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("SMTP is not configured, password reset link for {}: {}", email, link);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Vibrum: password reset");
        message.setText("""
                To reset your Vibrum password, open the link below. It expires in 30 minutes.

                %s

                If you did not request a password reset, ignore this email.
                """.formatted(link));
        try {
            sender.send(message);
        } catch (MailException e) {
            log.error("Failed to send password reset email to {}", email, e);
        }
    }
}
