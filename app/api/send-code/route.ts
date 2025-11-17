import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email, name, code } = await req.json();
    
    // Validate input
    if (!email || !code) {
      console.error('[send-code] Missing required fields');
      return NextResponse.json(
        { error: "Email and code are required" }, 
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[send-code] RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: "Email service is not configured" }, 
        { status: 500 }
      );
    }

    console.log('[send-code] Sending verification code:', { 
      to: email, 
      code,
      nodeEnv: process.env.NODE_ENV 
    });

    const resend = new Resend(apiKey);
    
    try {
      // Create a simple HTML email without React rendering
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Your Verification Code</h1>
          <p>Hello,</p>
          <p>Your verification code is: <strong style="font-size: 1.2em;">${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <p>Best regards,<br>The DERIV Team</p>
        </div>
      `;
      
      const { data, error } = await resend.emails.send({
        from: 'DERIV <noreply@taskforgein.site>',
        to: email,
        subject: 'Your Deriv Verification Code',
        html: emailHtml,
      });

      if (error) {
        console.error('[send-code] Resend API error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to send verification email',
            ...(process.env.NODE_ENV !== 'production' && { details: error })
          },
          { status: 500 }
        );
      }

      console.log('[send-code] Email sent successfully:', data);
      return NextResponse.json({ success: true });
      
    } catch (err) {
      console.error('[send-code] Error in Resend API call:', err);
      return NextResponse.json(
        { 
          error: 'Failed to process email request',
          ...(process.env.NODE_ENV !== 'production' && { details: String(err) })
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[send-code] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
