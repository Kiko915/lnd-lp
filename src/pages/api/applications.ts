import type { APIRoute } from 'astro';
import { Client as Appwrite, Databases, ID } from 'node-appwrite';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize Appwrite
const client = new Appwrite();
client
    .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(import.meta.env.PUBLIC_APPWRITE_API_KEY);

const databases = new Databases(client);

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: import.meta.env.MAILGUN_API_KEY,
    url: 'https://api.mailgun.net'
});

const DATABASE_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID;
const APPLICATIONS_COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID;

async function sendConfirmationEmail(email: string, name: string) {
    try {
        await mg.messages.create(import.meta.env.MAILGUN_DOMAIN, {
            from: `LND Applications <postmaster@${import.meta.env.MAILGUN_DOMAIN}>`,
            to: email,
            subject: 'Application Received - Lingkod Ng Dambana',
            template: 'application-confirmation',
            'h:X-Mailgun-Variables': JSON.stringify({
                name: name,
                email: email
            })
        });
    } catch (error) {
        console.error('Mailgun error:', error);
        throw error;
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'birthdate', 'address', 'ministry'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            return new Response(
                JSON.stringify({
                    message: `Missing required fields: ${missingFields.join(', ')}`
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Store application
        const application = await databases.createDocument(
            DATABASE_ID,
            APPLICATIONS_COLLECTION_ID,
            ID.unique(),
            {
                ...data,
                status: 'pending',
                submittedAt: new Date().toISOString()
            }
        );

        // Send confirmation email
        await sendConfirmationEmail(data.email, `${data.firstName} ${data.lastName}`);

        return new Response(
            JSON.stringify({
                message: 'Application submitted successfully',
                applicationId: application.$id
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Application submission error:', error);
        return new Response(
            JSON.stringify({
                message: 'Failed to submit application',
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}; 