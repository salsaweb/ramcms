import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(email: string, name: string, token: string) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invite?token=${token}`;

  await resend.emails.send({
    from: 'Janzu Portal <onboarding@resend.dev>',
    to: email,
    subject: "You've been invited to Janzu Portal",
    html: getInviteEmailTemplate(name, inviteUrl),
  });
}

function getInviteEmailTemplate(name: string, inviteUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #1a1a1a;">
      <h2 style="margin-bottom: 8px;">Welcome to Janzu Portal, ${name}!</h2>

      <p>An administrator has created an account for you. Click the button below to set your password and get started.</p>

      <p style="margin: 24px 0;">
        <a href="${inviteUrl}"
           style="display:inline-block;padding:12px 20px;background:#22c55e;color:white;border-radius:6px;text-decoration:none;font-weight:600;">
          Accept Invitation
        </a>
      </p>

      <p style="font-size: 12px; color: gray;">
        This invitation link expires in 72 hours.
      </p>

      <p style="font-size: 12px; color: gray;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
}
