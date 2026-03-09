import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://splitquick.online';

interface SendInvitationParams {
  toEmail: string;
  groupName: string;
  inviterName: string;
  isGuest: boolean;
}

export async function sendGroupInvitationEmail(params: SendInvitationParams): Promise<void> {
  const { toEmail, groupName, inviterName, isGuest } = params;

  const subject = isGuest
    ? `${inviterName} invited you to join SplitQuick`
    : `${inviterName} added you to "${groupName}" on SplitQuick`;

  const html = buildInvitationHtml({ groupName, inviterName, isGuest });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[EmailService] Failed to send invitation email to ${toEmail}:`, error);
  }
}

function buildInvitationHtml(params: { groupName: string; inviterName: string; isGuest: boolean }): string {
  const { groupName, inviterName, isGuest } = params;

  const actionText = isGuest
    ? 'Create your free account to start tracking and splitting expenses with your group.'
    : 'Log in to see the group and start tracking expenses.';

  const buttonText = isGuest ? 'Join SplitQuick' : 'View Group';
  const buttonUrl = isGuest ? `${FRONTEND_URL}/register` : `${FRONTEND_URL}/dashboard`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">SplitQuick</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;">You've been invited!</h2>
          <p style="color:#3f3f46;line-height:1.6;margin:0 0 8px;">
            <strong>${inviterName}</strong> added you to the group <strong>&ldquo;${groupName}&rdquo;</strong> on SplitQuick.
          </p>
          <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
            ${actionText}
          </p>
          <div style="text-align:center;">
            <a href="${buttonUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:16px;">
              ${buttonText}
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;background:#f4f4f5;text-align:center;">
          <p style="color:#71717a;font-size:12px;margin:0;">SplitQuick &mdash; Split expenses with friends, easily.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
