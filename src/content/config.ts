import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        // Transform string to Date object
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
        caption: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }),
});

const pages = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().nullable().optional(),
        pubDate: z.coerce.date().optional(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
    }),
});

const paperNotes = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        pubDate: z.coerce.date(),
        tags: z.array(z.string()).optional(),
        author: z.string().optional(),
    }),
});

export const collections = { blog, pages, 'paper-notes': paperNotes };
