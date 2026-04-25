import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email, otp, purpose = "verify") => {
	const subject = purpose === "reset" ? "Lumora — Reset your password" : "Lumora — Verify your email";
	const heading  = purpose === "reset" ? "Reset your password" : "Verify your email";
	const message  = purpose === "reset"
		? "Use the OTP below to reset your Lumora password. It expires in 10 minutes."
		: "Use the OTP below to verify your Lumora account. It expires in 10 minutes.";

	await resend.emails.send({
		from: "Lumora <onboarding@resend.dev>",
		to: email,
		subject,
		html: `
			<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1a;color:#e2e8f0;border-radius:12px;">
				<h2 style="color:#a78bfa;margin-top:0;">${heading}</h2>
				<p style="color:#94a3b8;">${message}</p>
				<div style="background:#1e1b4b;border:1px solid #4c1d95;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
					<span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#c4b5fd;">${otp}</span>
				</div>
				<p style="color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
			</div>
		`,
	});
};
