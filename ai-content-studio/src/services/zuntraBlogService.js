import { supabase } from '../supabase/client';

export const ZUNTRA_CATEGORIES = [
    { value: 'FEATURES', label: 'FEATURES', defaultColor: '#8b5cf6' },
    { value: 'INDUSTRY INSIGHT', label: 'INDUSTRY INSIGHT', defaultColor: '#10b981' },
    { value: 'ARTICLES', label: 'ARTICLES', defaultColor: '#3b82f6' },
    { value: 'USE CASES', label: 'USE CASES', defaultColor: '#f59e0b' },
];

export const getCategoryDefaultColor = (category) => {
    const found = ZUNTRA_CATEGORIES.find(c => c.value === category);
    return found ? found.defaultColor : '#8b5cf6';
};

/**
 * Fetch all Zuntra blogs ordered by created_at descending
 */
export async function getZuntraBlogs() {
    const { data, error } = await supabase
        .from('zuntra_blogs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Inline toggle for boolean flags (e.g. published, featured)
 */
export async function updateZuntraBlogToggle(id, field, value) {
    const { data, error } = await supabase
        .from('zuntra_blogs')
        .update({ [field]: value })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

/**
 * Delete a blog post by id
 */
export async function deleteZuntraBlog(id) {
    const { error } = await supabase
        .from('zuntra_blogs')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
    return true;
}

/**
 * Duplicate a post:
 * copies with title: "<title> (Copy)", new slug, published = false, featured = false
 */
export async function duplicateZuntraBlog(blog) {
    const newTitle = `${blog.title} (Copy)`;
    let baseSlug = (blog.slug || 'post') + '-copy';
    baseSlug = baseSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // live uniqueness check for slug
    let candidateSlug = baseSlug;
    let counter = 1;
    while (true) {
        const { data } = await supabase
            .from('zuntra_blogs')
            .select('id')
            .eq('slug', candidateSlug)
            .limit(1);

        if (!data || data.length === 0) {
            break;
        }
        counter++;
        candidateSlug = `${baseSlug}-${counter}`;
    }

    const { id, created_at, updated_at, ...rest } = blog;
    const duplicatedData = {
        ...rest,
        title: newTitle,
        slug: candidateSlug,
        published: false,
        featured: false,
    };

    const { data, error } = await supabase
        .from('zuntra_blogs')
        .insert([duplicatedData])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

/**
 * Create a new Zuntra blog post
 */
export async function createZuntraBlog(blogData) {
    const { data, error } = await supabase
        .from('zuntra_blogs')
        .insert([blogData])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

/**
 * Update an existing Zuntra blog post
 */
export async function updateZuntraBlog(id, blogData) {
    const { data, error } = await supabase
        .from('zuntra_blogs')
        .update(blogData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

/**
 * Generate a unique slug from a title
 */
export async function generateUniqueSlug(title, excludeId = null) {
    let baseSlug = (title || 'post')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'post';

    let candidateSlug = baseSlug;
    let counter = 1;
    while (true) {
        const available = await isSlugAvailable(candidateSlug, excludeId);
        if (available) {
            return candidateSlug;
        }
        counter++;
        candidateSlug = `${baseSlug}-${counter}`;
    }
}

/**
 * Check if a slug is available (returns true if available, false if taken)
 */
export async function isSlugAvailable(slug, excludeId = null) {
    if (!slug) return true;
    let query = supabase
        .from('zuntra_blogs')
        .select('id')
        .eq('slug', slug);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);
    if (error) {
        console.error('Error checking slug:', error);
        return true;
    }
    return !data || data.length === 0;
}
