import nodemailer from 'nodemailer';
import prisma from './prisma';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const transporter = smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

/**
 * Sends idempotent account activation email after verified Stripe payment
 */
export async function sendActivationEmail(userId: number, planName: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Idempotency check using UserSetting / SystemLog
    const alreadySent = await prisma.userSetting.findUnique({
      where: { userId_key: { userId, key: `activation_email_sent_${planName}` } },
    });

    if (alreadySent) {
      console.log(`Activation email already sent to user ${userId} for plan ${planName}`);
      return true;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aurasend.com';

    const mailOptions = {
      from: `"AuraSend" <${smtpUser || 'support@aurasend.com'}>`,
      to: user.email,
      subject: `🎉 Your AuraSend ${planName} Plan is Now Active!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="color: #2563eb;">Welcome to AuraSend ${planName}!</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>Thank you for upgrading! Your subscription to the <strong>${planName}</strong> plan has been successfully verified and activated.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Account Details:</p>
            <p style="margin: 5px 0 0 0;">Email: ${user.email}</p>
            <p style="margin: 5px 0 0 0;">Plan: ${planName}</p>
            <p style="margin: 5px 0 0 0;">Status: Active</p>
          </div>

          <p>You now have full access to your plan's AI generations, campaign slots, and lead enrichment limits.</p>
          
          <div style="margin: 30px 0;">
            <a href="${appUrl}/dashboard" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">AuraSend Inc. — Cold Email Automation Platform</p>
        </div>
      `,
    };

    if (transporter) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log(`[Mock Transact Email] Sent activation email to ${user.email} for ${planName}`);
    }

    // Record idempotency flag
    await prisma.userSetting.create({
      data: {
        userId,
        key: `activation_email_sent_${planName}`,
        value: new Date().toISOString(),
      },
    });

    return true;
  } catch (e) {
    console.error('Error sending activation email:', e);
    return false;
  }
}
