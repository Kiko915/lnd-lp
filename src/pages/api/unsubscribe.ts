import type { APIRoute } from 'astro';
import { Client as Appwrite, Databases, Query } from 'node-appwrite';

// Initialize Appwrite
const client = new Appwrite();
client
    .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(import.meta.env.PUBLIC_APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_NEWSLETTER_COLLECTION_ID;

export const GET: APIRoute = async ({ url }) => {
    try {
        const email = url.searchParams.get('email');

        if (!email) {
            return new Response(
                JSON.stringify({
                    message: 'Email parameter is required'
                }), 
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Find subscriber
        const subscribers = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.equal('email', email)
            ]
        );

        if (subscribers.documents.length === 0) {
            return new Response(
                JSON.stringify({
                    message: 'Email not found in subscription list'
                }), 
                { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const subscriber = subscribers.documents[0];

        // Update subscriber status to unsubscribed
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            subscriber.$id,
            {
                status: 'unsubscribed',
                unsubscribed_at: new Date().toISOString()
            }
        );

        // Return success response with HTML
        return new Response(
            `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Unsubscribed - LND Newsletter</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div class="mb-6">
                        <svg class="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800 mb-4">Successfully Unsubscribed</h1>
                    <p class="text-gray-600 mb-6">
                        You have been successfully unsubscribed from the LND Newsletter.
                        We're sorry to see you go!
                    </p>
                    <a 
                        href="/" 
                        class="inline-block bg-[#205488] text-white px-6 py-3 rounded-lg hover:bg-[#1a4570] transition-colors"
                    >
                        Return to Homepage
                    </a>
                </div>
            </body>
            </html>
            `,
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/html'
                }
            }
        );

    } catch (error) {
        console.error('Unsubscribe error:', error);
        
        return new Response(
            JSON.stringify({
                message: 'Failed to process unsubscription'
            }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}; 