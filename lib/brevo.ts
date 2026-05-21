import "server-only";

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT),
    secure: false,

    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

type SendEmailParams = {
    to: string;
    subject: string;
    html: string;
};

export async function sendEmail({
    to,
    subject,
    html,
}: SendEmailParams) {
    return transporter.sendMail({
        from: `"${process.env.BREVO_SENDER_NAME}" <${process.env.BREVO_SENDER_EMAIL}>`,

        to,

        subject,

        html,
    });
}