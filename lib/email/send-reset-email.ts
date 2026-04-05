import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'Your App <onboarding@resend.dev>',
    to: email, // ['delivered@resend.dev']
    subject: 'Reset your password',
    html: getEmailTemplate(resetUrl),
  });
}

function getEmailTemplate(resetUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset your password</h2>

      <p>You requested a password reset.</p>

      <p>
        <a href="${resetUrl}" 
           style="display:inline-block;padding:10px 16px;background:#22c55e;color:white;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>

      <p style="font-size: 12px; color: gray;">
        This link expires in 1 hour.
      </p>

      <p style="font-size: 12px; color: gray;">
        If you didn’t request this, you can ignore this email.
      </p>
    </div>
  `;
}