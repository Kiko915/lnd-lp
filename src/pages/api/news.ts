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
const NEWS_COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_NEWS_COLLECTION_ID;

export const GET: APIRoute = async () => {
    try {
        // Fetch featured news (limit to 2)
        const featuredNews = await databases.listDocuments(
            DATABASE_ID,
            NEWS_COLLECTION_ID,
            [
                Query.equal('featured', true),
                Query.orderDesc('publishedAt'),
                Query.limit(2)
            ]
        );

        // Fetch latest news (excluding featured ones, limit to 3)
        const latestNews = await databases.listDocuments(
            DATABASE_ID,
            NEWS_COLLECTION_ID,
            [
                Query.equal('featured', false),
                Query.orderDesc('publishedAt'),
                Query.limit(3)
            ]
        );

        return new Response(
            JSON.stringify({
                featured: featuredNews.documents,
                latest: latestNews.documents
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error fetching news:', error);
        return new Response(
            JSON.stringify({
                message: 'Failed to fetch news',
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