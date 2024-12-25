import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { Client, Databases } from 'node-appwrite';

export const prerender = false;

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: import.meta.env.MAILGUN_API_KEY || ''
});

// Initialize Appwrite
const client = new Client()
    .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(import.meta.env.PUBLIC_APPWRITE_API_KEY);

const databases = new Databases(client);

export async function POST({ request }: { request: Request }) {
    try {
        const data = await request.json();
        const { name, email, subject, message } = data;

        // Save to Appwrite Database
        await databases.createDocument(
            '6764fe95001fb3c5c54c',
            '6764feb300379fa98acb',
            'unique()',
            {
                name,
                email,
                subject,
                message,
                createdAt: new Date().toISOString()
            }
        );

        try {
            // Send email notification to admin
            await mg.messages.create(import.meta.env.MAILGUN_DOMAIN || '', {
                from: `Lingkod ng Dambana Website <noreply@${import.meta.env.MAILGUN_DOMAIN}>`,
                to: 'francismistica06@gmail.com',
                subject: `New Contact Form Submission: ${subject}`,
                text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
                `,
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #800000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #ffffff; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; color: #666; }
        .message-box { background-color: #f9f9f9; border-left: 4px solid #800000; padding: 15px; margin: 10px 0; }
        .gold-text { color: #DAA520; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
        </div>
        <div class="content">
            <p><strong class="gold-text">Name:</strong> ${name}</p>
            <p><strong class="gold-text">Email:</strong> ${email}</p>
            <p><strong class="gold-text">Subject:</strong> ${subject}</p>
            <h3 class="gold-text">Message:</h3>
            <div class="message-box">
                ${message}
            </div>
        </div>
        <div class="footer">
            <p>Lingkod ng Dambana Website</p>
        </div>
    </div>
</body>
</html>
                `
            });

            // Send confirmation email to the sender
            await mg.messages.create(import.meta.env.MAILGUN_DOMAIN || '', {
                from: `Lingkod ng Dambana Website <noreply@${import.meta.env.MAILGUN_DOMAIN}>`,
                to: email,
                subject: `Thank you for contacting Lingkod ng Dambana`,
                text: `
Dear ${name},

Thank you for contacting Lingkod ng Dambana. This email confirms that we have received your message.

Here's a copy of your submission:
Subject: ${subject}
Message:
${message}

We will get back to you as soon as possible.

Best regards,
Lingkod ng Dambana Team
                `,
                html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #fdc83d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #ffffff; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; color: #666; }
        .message-box { background-color: #f9f9f9; border-left: 4px solid #fdc83d; padding: 15px; margin: 10px 0; }
        .gold-text { color: #DAA520; }
        .thank-you { font-size: 24px; color: #205488; text-align: center; margin-bottom: 20px; }
        .logo {width: 100px; height: 100px; box-shadow: 1px}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
        	<img src="https://res.cloudinary.com/da3b5g9ad/image/upload/v1734514095/lnd-landing-assets/jacmg5e6qwakjxz1ogge.png" class="logo"  />
            <h2 style="margin: 0;">Lingkod ng Dambana</h2>
        </div>
        <div class="content">
            <p class="thank-you">Thank You for Reaching Out!</p>
            <p>Dear ${name},</p>
            <p>We have received your message and appreciate you taking the time to contact us. Our team will review your inquiry and respond as soon as possible.</p>
            
            <h3 class="gold-text">Your Message Details:</h3>
            <div class="message-box">
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            </div>
            
            <p style="margin-top: 20px;">If you have any additional questions, please don't hesitate to contact us again.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Lingkod ng Dambana Team</p>
        </div>
    </div>
</body>
</html>
                `
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Continue execution even if email fails
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Error processing contact form:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to process contact form submission'
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
} 