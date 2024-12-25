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
const EVENTS_COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_EVENTS_COLLECTION_ID;

export const GET: APIRoute = async () => {
    try {
        // Get current date
        const now = new Date();
        const isoDate = now.toISOString();

        // Fetch upcoming events
        const upcomingEvents = await databases.listDocuments(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            [
                Query.greaterThan('eventDate', isoDate),
                Query.orderAsc('eventDate'),
                Query.limit(6)
            ]
        );

        // Fetch past events
        const pastEvents = await databases.listDocuments(
            DATABASE_ID,
            EVENTS_COLLECTION_ID,
            [
                Query.lessThan('eventDate', isoDate),
                Query.orderDesc('eventDate'),
                Query.limit(3)
            ]
        );

        return new Response(
            JSON.stringify({
                upcoming: upcomingEvents.documents,
                past: pastEvents.documents
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error fetching events:', error);
        return new Response(
            JSON.stringify({
                message: 'Failed to fetch events',
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}; 