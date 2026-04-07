/**
 * Email sending utility.
 * Uses Resend if RESEND_API_KEY is set, otherwise logs to console (dev mode).
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || apiKey.startsWith('re_REPLACE')) {
    // Dev mode: log to console
    console.log('📧 [DEV EMAIL] To:', options.to)
    console.log('📧 [DEV EMAIL] Subject:', options.subject)
    console.log('📧 [DEV EMAIL] Body:', options.html.replace(/<[^>]+>/g, ''))
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'AutoSwipe <noreply@autoswipe.co.il>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(`Email send failed: ${JSON.stringify(error)}`)
  }
}

export function buildPasswordResetEmail(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #0F0F0F; color: #F5F5F5; padding: 40px 20px; direction: rtl;">
  <div style="max-width: 480px; margin: 0 auto; background: #1A1A1A; border-radius: 16px; padding: 40px; border: 1px solid #2A2A2A;">
    <h1 style="color: #D4A843; font-size: 24px; margin-bottom: 8px;">🔐 איפוס סיסמה</h1>
    <p style="color: #888888; margin-bottom: 24px;">שלום ${userName},</p>
    <p style="color: #F5F5F5; margin-bottom: 24px;">
      קיבלנו בקשה לאיפוס הסיסמה שלך ב-AutoSwipe.<br>
      לחץ על הכפתור למטה כדי לאפס את הסיסמה:
    </p>
    <a href="${resetUrl}"
       style="display: inline-block; background: #D4A843; color: #0F0F0F; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; margin-bottom: 24px;">
      אפס סיסמה
    </a>
    <p style="color: #888888; font-size: 13px; margin-top: 24px;">
      הקישור תקף למשך שעה אחת.<br>
      אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.
    </p>
    <hr style="border-color: #2A2A2A; margin: 24px 0;">
    <p style="color: #555555; font-size: 12px;">AutoSwipe — שוק הרכב החכם</p>
  </div>
</body>
</html>
  `.trim()
}

export function buildWelcomeEmail(userName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #0F0F0F; color: #F5F5F5; padding: 40px 20px; direction: rtl;">
  <div style="max-width: 480px; margin: 0 auto; background: #1A1A1A; border-radius: 16px; padding: 40px; border: 1px solid #2A2A2A;">
    <h1 style="color: #D4A843; font-size: 24px; margin-bottom: 8px;">🚗 ברוך הבא ל-AutoSwipe!</h1>
    <p style="color: #F5F5F5; margin-bottom: 16px;">שלום ${userName},</p>
    <p style="color: #888888; margin-bottom: 24px;">
      החשבון שלך נוצר בהצלחה.<br>
      עכשיו תוכל להתחיל לגלול רכבים ולמצוא את הרכב שחלמת עליו.
    </p>
    <p style="color: #555555; font-size: 13px; margin-top: 32px;">AutoSwipe — שוק הרכב החכם</p>
  </div>
</body>
</html>
  `.trim()
}
