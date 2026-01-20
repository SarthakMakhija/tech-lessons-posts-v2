import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getCollection } from 'astro:content';
import * as fs from 'fs';
import * as path from 'path';

const propertyId = import.meta.env.GA_PROPERTY_ID || process.env.GA_PROPERTY_ID;
const credentialsJson = import.meta.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const googleAppCreds = import.meta.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Mock data for development or when credentials are missing
const MOCK_TOP_PAGES = [
    {
        path: '/en/blog/aws_lambda_a_virtual_podcast',
        views: 1250,
        title: 'AWS Lambda: A Virtual Podcast'
    },
    {
        path: '/en/blog/diving_into_rust',
        views: 980,
        title: 'Diving into Rust'
    },
    {
        path: '/en/blog/bloom_filter',
        views: 850,
        title: 'Bloom Filter: A Probabilistic Data Structure'
    },
    {
        path: '/en/blog/bitcask',
        views: 720,
        title: 'Bitcask: A Log-Structured Hash Table for Fast Key/Value Data'
    },
    {
        path: '/en/blog/designing_lfu_cache',
        views: 640,
        title: 'Designing LFU Cache'
    }
];

export interface TopPage {
    path: string;
    views: number;
    title: string;
}

export async function fetchTopEssays(): Promise<TopPage[]> {
    // If no credentials, return mock data
    if (!propertyId) {
        console.warn('TopEssays: GA_PROPERTY_ID not found. Using mock data.');
        return MOCK_TOP_PAGES;
    }

    // Check for credentials
    if (!credentialsJson && !googleAppCreds) {
        console.warn('TopEssays: GA_PROPERTY_ID found, but GOOGLE_APPLICATION_CREDENTIALS_JSON/GOOGLE_APPLICATION_CREDENTIALS not found. Using mock data.');
        return MOCK_TOP_PAGES;
    }

    try {
        const clientOptions: any = {};
        if (credentialsJson) {
            clientOptions.credentials = JSON.parse(credentialsJson);
        } else if (googleAppCreds) {
            try {
                // Resolve path relative to CWD (project root)
                const keyPath = path.resolve(process.cwd(), googleAppCreds);
                if (fs.existsSync(keyPath)) {
                    const keyContent = fs.readFileSync(keyPath, 'utf-8');
                    clientOptions.credentials = JSON.parse(keyContent);
                } else {
                    console.warn(`TopEssays: Key file does not exist at ${keyPath}`);
                }
            } catch (readErr) {
                console.error('TopEssays: Failed to read key file:', readErr);
            }
        }

        const analyticsDataClient = new BetaAnalyticsDataClient(clientOptions);

        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
                {
                    startDate: '2020-01-01',
                    endDate: 'today',
                },
            ],
            dimensions: [
                {
                    name: 'pagePath',
                },
            ],
            metrics: [
                {
                    name: 'screenPageViews',
                },
            ],
            dimensionFilter: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: {
                        matchType: 'BEGINS_WITH',
                        value: '/en/blog/',
                    },
                },
            },
            orderBys: [
                {
                    metric: {
                        metricName: 'screenPageViews',
                    },
                    desc: true,
                },
            ],
            limit: 10,
        });

        const blogEntries = await getCollection('blog');
        const blogMap = new Map(blogEntries.map((entry) => [`/en/blog/${entry.slug}`, entry.data.title]));
        // Also map with trailing slash just in case
        blogEntries.forEach(entry => blogMap.set(`/en/blog/${entry.slug}/`, entry.data.title));

        const topPages: TopPage[] = [];

        response.rows?.forEach((row) => {
            const path = row.dimensionValues?.[0]?.value;
            const views = parseInt(row.metricValues?.[0]?.value || '0', 10);

            if (path && views > 0) {
                // Normalize path to remove trailing slash for matching
                const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
                const title = blogMap.get(path) || blogMap.get(normalizedPath);

                if (title) {
                    topPages.push({
                        path,
                        views,
                        title,
                    });
                }
            }
        });

        if (topPages.length > 0) {
            return topPages;
        } else {
            console.warn('TopEssays: No top pages found after filtering. Returning mock data.');
            return MOCK_TOP_PAGES;
        }

    } catch (error) {
        console.error('Error fetching data from Google Analytics:', error);
        return MOCK_TOP_PAGES;
    }
}
