import type { APIRoute } from 'astro';
import { Client as Appwrite, Databases, Query, ID } from 'node-appwrite';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Mark as server-rendered
export const prerender = false;

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
const COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_NEWSLETTER_COLLECTION_ID;

async function sendWelcomeEmail(email: string) {
    try {
        await mg.messages.create(import.meta.env.MAILGUN_DOMAIN, {
            from: `LND Newsletter <postmaster@${import.meta.env.MAILGUN_DOMAIN}>`,
            to: email,
            subject: 'Welcome to LND Newsletter!',
            template: 'welcome-newsletter',
            'h:X-Mailgun-Variables': JSON.stringify({
                email: email
            })
        });
    } catch (error) {
        console.error('Mailgun error:', error);
        // Log more details about the error
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
        }
        throw error;
    }
}

export const GET: APIRoute = async () => {
    return new Response(
        JSON.stringify({
            message: 'LND Newsletter API',
            version: '1.0.0',
            endpoints: {
                POST: '/api/newsletter',
                GET: '/api/newsletter'
            }
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

export const POST: APIRoute = async ({ request }) => {
    try {
        // Check if request has a body
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return new Response(
                JSON.stringify({
                    message: 'Content-Type must be application/json'
                }), 
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const data = await request.json();
        console.log('Received data:', data); // Debug log

        const { email } = data;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(
                JSON.stringify({
                    message: 'Invalid email address'
                }), 
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        try {
            // Check if email already exists
            const existingSubscribers = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    Query.equal('email', email)
                ]
            );

            if (existingSubscribers.documents.length > 0) {
                return new Response(
                    JSON.stringify({
                        message: 'Email already subscribed'
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Store new subscriber
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    email,
                    subscribed_at: new Date().toISOString(),
                    status: 'active'
                }
            );

            // Send welcome email
            await sendWelcomeEmail(email);

            return new Response(
                JSON.stringify({
                    message: 'Successfully subscribed to newsletter'
                }), 
                { 
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        } catch (error) {
            console.error('Appwrite/Mailgun error:', error);
            return new Response(
                JSON.stringify({
                    message: 'Failed to process subscription',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }), 
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        
        return new Response(
            JSON.stringify({
                message: 'Invalid request format',
                error: error instanceof Error ? error.message : 'Unknown error'
            }), 
            { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
