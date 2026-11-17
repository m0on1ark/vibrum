package pl.minibank.group.invitation;

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
public class GroupInvitationMailer {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String publicUrl;
    private final String from;

    public GroupInvitationMailer(ObjectProvider<JavaMailSender> mailSender,
                                 @Value("${app.public-url}") String publicUrl,
                                 @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.publicUrl = publicUrl;
        this.from = from;
    }

    public void send(String email, String inviterDisplayName, String groupName) {
        String link = UriComponentsBuilder.fromUriString(publicUrl)
                .path("/invitations")
                .toUriString();

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("SMTP is not configured, invitation link for {}: {}", email, link);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Vibrum: zaproszenie do grupy");
        message.setText("""
                Użytkownik %s zaprosił Cię do grupy "%s" w aplikacji Vibrum!

                Aby przejrzeć i zaakceptować zaproszenie, przejdź pod poniższy link:
                %s
                """.formatted(inviterDisplayName, groupName, link));
        try {
            sender.send(message);
        } catch (MailException e) {
            log.error("Failed to send group invitation email to {}", email, e);
        }
    }
}
