import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class EmailService:
    """Ready-to-plug-in email service.
    Defaults to MOCK mode (logging) until SMTP credentials are provided.
    """

    def __init__(self):
        self.smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", 587))
        self.smtp_user = os.environ.get("SMTP_USER")
        self.smtp_pass = os.environ.get("SMTP_PASS")

        self.is_configured = all([self.smtp_user, self.smtp_pass])

    def send_report(self, recipient_email, subject, report_content):
        """Sends the race report via email."""
        if not self.is_configured:
            print("--- EMAIL SERVICE NOT CONFIGURED ---")
            print(f"To: {recipient_email}")
            print(f"Subject: {subject}")
            print("Content:")
            print(report_content)
            print("--------------------------------------")
            return True, "Report logged to console (Mock Mode). Configure SMTP in .env to send real emails."

        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = recipient_email
            msg['Subject'] = subject
            msg.attach(MIMEText(report_content, 'plain'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_pass)
            server.send_message(msg)
            server.quit()

            return True, "Email sent successfully."
        except Exception as e:
            return False, f"Failed to send email: {str(e)}"

# Singleton instance
email_service = EmailService()
