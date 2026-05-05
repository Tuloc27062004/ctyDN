import { Resend } from "resend";
import { env } from "@/lib/env";

// Initialize Resend with the API key from environment variables
const resend = new Resend(env.RESEND_API_KEY);

export async function sendApprovedEmail(params: {
  to: string;
  name: string;
}) {
  const { to, name } = params;

  const approvedAccountUrl = env.APPROVED_ACCOUNT_URL;

  return resend.emails.send({
    from: `EcoCrete <${env.RESEND_FROM_EMAIL}>`,
    to,
    subject: "Your account was approved",
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6">
        <h2>Approved ✅</h2>
        <p>Hi ${escapeHtml(name)}, your account has been approved.</p>
        <p>You can now access your account using the link below:</p>
        <p>
          <a
            href="${escapeHtml(approvedAccountUrl)}"
            style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;"
          >
            Go to Login
          </a>
        </p>
        <p>If you didn’t request this, you can ignore this email.</p>
      </div>
    `,
  });
}

// Utility to prevent XSS in email bodies
function escapeHtml(s: string) {
  if (!s) return "";

  return s.replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[c]!
  );
}