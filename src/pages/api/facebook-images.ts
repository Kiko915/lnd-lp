import type { APIRoute } from 'astro';

export const prerender = false;

interface FacebookImage {
    id: string;
    source: string;
    created_time: string;
    caption?: string;
    album?: string;
}

interface FacebookResponse {
    data: {
        id: string;
        full_picture?: string;
        created_time: string;
        message?: string;
        attachments?: {
            data: Array<{
                type: string;
                media?: {
                    image?: {
                        src: string;
                    };
                };
            }>;
        };
    }[];
    paging?: {
        cursors: {
            before: string;
            after: string;
        };
        next?: string;
    };
}

async function fetchFacebookImages(pageId: string, accessToken: string, apiVersion: string, cursor?: string): Promise<{ images: FacebookImage[], paging?: { cursors: { before: string; after: string; }; next?: string; } }> {
    try {
        const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
        const params = new URLSearchParams({
            access_token: accessToken,
            fields: 'id,full_picture,created_time,message,attachments{type,media,title,description}',
            limit: '20'
        });

        if (cursor) {
            params.append('after', cursor);
        }

        const finalUrl = `${url}?${params}`;
        console.log('Fetching from URL:', finalUrl);

        const response = await fetch(finalUrl);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Facebook API Error:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FacebookResponse = await response.json();
        console.log('Facebook API Response:', data);
        
        const images = data.data
            .filter(post => post.full_picture || (post.attachments?.data[0]?.type === 'photo'))
            .map(post => ({
                id: post.id,
                source: post.full_picture || post.attachments?.data[0]?.media?.image?.src || '',
                created_time: post.created_time,
                caption: post.message,
                album: 'Timeline Photos'
            }))
            .filter(image => image.source); // Ensure we only return images with a valid source

        return {
            images,
            paging: data.paging
        };
    } catch (error) {
        console.error('Error fetching Facebook images:', error);
        throw error;
    }
}

export const GET: APIRoute = async ({ request }) => {
    try {
        const pageId = import.meta.env.FACEBOOK_PAGE_ID;
        const accessToken = import.meta.env.FACEBOOK_ACCESS_TOKEN;
        const apiVersion = import.meta.env.FACEBOOK_API_VERSION;

        if (!pageId || !accessToken || !apiVersion) {
            return new Response(JSON.stringify({
                error: 'Missing Facebook API configuration'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Get cursor from URL params
        const url = new URL(request.url);
        const cursorParam = url.searchParams.get('cursor');
        const cursor = cursorParam || undefined;

        const { images, paging } = await fetchFacebookImages(pageId, accessToken, apiVersion, cursor);

        // Group images by album
        const groupedImages = images.reduce((acc, image) => {
            const album = image.album || 'Uncategorized';
            if (!acc[album]) {
                acc[album] = [];
            }
            acc[album].push(image);
            return acc;
        }, {} as Record<string, FacebookImage[]>);

        return new Response(JSON.stringify({
            success: true,
            images: groupedImages,
            paging
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch Facebook images'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}; 