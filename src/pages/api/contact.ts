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
            // Send email notification
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
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<h3>Message:</h3>
<p>${message}</p>
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