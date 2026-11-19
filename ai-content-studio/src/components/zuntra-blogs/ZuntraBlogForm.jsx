import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    FileText,
    Palette,
    Tag,
    BookOpen,
    Send,
    Save,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    Calendar,
    User,
    Image,
    Eye,
    Code,
    Columns,
    X,
    Plus,
    Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { marked } from 'marked';
import {
    ZUNTRA_CATEGORIES,
    getCategoryDefaultColor,
    isSlugAvailable,
    generateUniqueSlug,
    createZuntraBlog
} from '../../services/zuntraBlogService';
import { generateZuntraPostAI } from '../../services/zuntraAIService';

// Format Date object or YYYY-MM-DD to "Mon DD, YYYY" (e.g. "Sep 02, 2026")
function formatDateToDisplay(dateStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
        }
    } catch {
        // fallback to original string
    }
    return dateStr;
}

// Convert "Mon DD, YYYY" (e.g. "Sep 02, 2026") to YYYY-MM-DD for <input type="date">
function formatDisplayToInputDate(displayStr) {
    if (!displayStr) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    try {
        const d = new Date(displayStr);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
    } catch {
        // ignore
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Tag Input Component
function TagInput({ label, tags, onChange, placeholder }) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmed = inputValue.trim().replace(/^,|,$/g, '');
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInputValue('');
        }
    };

    const removeTag = (indexToRemove) => {
        onChange(tags.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">{label}</Label>
            <div className="min-h-[42px] p-1.5 flex flex-wrap items-center gap-1.5 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                {tags.map((tag, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            className="hover:text-purple-900 text-purple-400 p-0.5 rounded"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? placeholder : 'Add more...'}
                    className="flex-1 min-w-[120px] bg-transparent text-sm px-2 py-1 outline-none text-gray-800 placeholder:text-gray-400"
                />
            </div>
            <p className="text-[11px] text-gray-400">Press Enter or comma to add each tag.</p>
        </div>
    );
}

export default function ZuntraBlogForm({
    initialBlog,
    onSave,
    onCancel,
    isSaving,
    onToast,
    existingBlogs = [],
    onBulkComplete
}) {
    const isEdit = !!initialBlog?.id;

    // Form fields
    const [title, setTitle] = useState(initialBlog?.title || '');
    const [slug, setSlug] = useState(initialBlog?.slug || '');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
    const [subtitle, setSubtitle] = useState(initialBlog?.subtitle || '');
    const [category, setCategory] = useState(initialBlog?.category || 'FEATURES');
    const [numBlogs, setNumBlogs] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [color, setColor] = useState(initialBlog?.color || getCategoryDefaultColor('FEATURES'));
    const [author, setAuthor] = useState(initialBlog?.author || 'Zuntra Engineering');
    const [inputDate, setInputDate] = useState(() => formatDisplayToInputDate(initialBlog?.date));
    const [time, setTime] = useState(initialBlog?.time || '1 MIN READ');
    const [timeManuallyEdited, setTimeManuallyEdited] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialBlog?.image_url || '');
    const [subtopics, setSubtopics] = useState(() =>
        initialBlog?.subtopics ? initialBlog.subtopics.split(',').map(s => s.trim()).filter(Boolean) : []
    );
    const [tags, setTags] = useState(() =>
        initialBlog?.tags ? initialBlog.tags.split(',').map(s => s.trim()).filter(Boolean) : []
    );
    const [content, setContent] = useState(initialBlog?.content || '');
    const [featured, setFeatured] = useState(initialBlog?.featured || false);
    const [published, setPublished] = useState(initialBlog?.published || false);

    // Validation & State
    const [errors, setErrors] = useState({});
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState(true);
    const [imgPreviewError, setImgPreviewError] = useState(false);
    const [editorTab, setEditorTab] = useState('split'); // 'split' | 'edit' | 'preview'

    // Auto-generate slug from title if not manually edited
    useEffect(() => {
        if (!slugManuallyEdited && title) {
            const generated = title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            setSlug(generated);
        }
    }, [title, slugManuallyEdited]);

    // Live slug uniqueness check (debounced)
    useEffect(() => {
        if (!slug.trim()) {
            setSlugAvailable(false);
            return;
        }

        setSlugChecking(true);
        const timer = setTimeout(async () => {
            try {
                const available = await isSlugAvailable(slug.trim(), initialBlog?.id);
                setSlugAvailable(available);
            } catch (e) {
                setSlugAvailable(true);
            } finally {
                setSlugChecking(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [slug, initialBlog?.id]);

    // Auto-calculate read time when content changes (if not manually edited)
    useEffect(() => {
        if (!timeManuallyEdited) {
            const words = content.trim().split(/\s+/).filter(Boolean).length;
            const minutes = Math.max(1, Math.ceil(words / 200));
            setTime(`${minutes} MIN READ`);
        }
    }, [content, timeManuallyEdited]);

    // When category changes, auto-fill color with its default
    const handleCategorySelect = (newCat) => {
        setCategory(newCat);
        setColor(getCategoryDefaultColor(newCat));
    };

    // Parse markdown content for live preview
    const renderedMarkdown = useMemo(() => {
        try {
            return marked.parse(content || '*No content written yet...*');
        } catch {
            return '<p>Error rendering preview</p>';
        }
    }, [content]);

    // Generate with AI handler
    const handleGenerateWithAI = async () => {
        if (!category) {
            if (onToast) onToast('Category is required before generating', 'error');
            return;
        }

        const totalCount = Math.max(1, Math.min(10, parseInt(numBlogs, 10) || 1));

        const hasUserTyped = Boolean(
            title.trim() ||
            subtitle.trim() ||
            content.trim() ||
            subtopics.length > 0 ||
            tags.length > 0
        );

        const existingTitles = (existingBlogs || []).map(b => b.title).filter(Boolean);

        // MODE B: The user only selected a category (everything else empty)
        if (!hasUserTyped) {
            if (totalCount === 1) {
                setIsGenerating(true);
                if (onToast) onToast(`Generating blog post for ${category}...`, 'info');
                try {
                    const aiResult = await generateZuntraPostAI({
                        category,
                        userInputs: {},
                        existingTitles,
                        angleIndex: 1,
                        totalAngles: 1
                    });

                    const words = aiResult.content.trim().split(/\s+/).filter(Boolean).length;
                    const calculatedTime = `${Math.max(1, Math.ceil(words / 200))} MIN READ`;
                    const uniqueSlug = await generateUniqueSlug(aiResult.title, initialBlog?.id);
                    const categoryColor = getCategoryDefaultColor(category);

                    const today = new Date();
                    const yyyyMmDd = today.toISOString().split('T')[0];

                    // Fill all form fields in place for review
                    setTitle(aiResult.title);
                    setSlug(uniqueSlug);
                    setSubtitle(aiResult.subtitle);
                    setCategory(category);
                    setColor(categoryColor);
                    setAuthor('Zuntra Engineering');
                    setInputDate(yyyyMmDd);
                    setTime(calculatedTime);
                    setSubtopics(aiResult.subtopics);
                    setTags(aiResult.tags);
                    setContent(aiResult.content);
                    setFeatured(false);
                    setPublished(false);
                    // image_url is NEVER generated or filled

                    if (onToast) onToast('AI generated! Review fields and save when ready.', 'success');
                } catch (err) {
                    console.error('AI Mode B error:', err);
                    if (onToast) onToast('Failed to generate post: ' + err.message, 'error');
                } finally {
                    setIsGenerating(false);
                }
                return;
            } else {
                // MODE B: Bulk generation & saving (Number of Blogs > 1)
                setIsGenerating(true);
                const failedIndices = [];
                const generatedTitlesThisSession = [];

                try {
                    for (let i = 1; i <= totalCount; i++) {
                        if (onToast) onToast(`Generating ${i} of ${totalCount}...`, 'info');

                        try {
                            const aiResult = await generateZuntraPostAI({
                                category,
                                userInputs: {},
                                existingTitles: [...existingTitles, ...generatedTitlesThisSession],
                                angleIndex: i,
                                totalAngles: totalCount
                            });

                            const words = aiResult.content.trim().split(/\s+/).filter(Boolean).length;
                            const calculatedTime = `${Math.max(1, Math.ceil(words / 200))} MIN READ`;
                            const uniqueSlug = await generateUniqueSlug(aiResult.title, null);
                            const categoryColor = getCategoryDefaultColor(category);

                            const today = new Date();
                            const todayFormatted = today.toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric'
                            });

                            const draftPost = {
                                title: aiResult.title,
                                slug: uniqueSlug,
                                subtitle: aiResult.subtitle,
                                category,
                                subtopics: Array.isArray(aiResult.subtopics) ? aiResult.subtopics.join(', ') : '',
                                author: 'Zuntra Engineering',
                                date: todayFormatted,
                                time: calculatedTime,
                                color: categoryColor,
                                image_url: null, // user adds images themselves
                                tags: Array.isArray(aiResult.tags) ? aiResult.tags.join(', ') : '',
                                content: aiResult.content,
                                featured: false,
                                published: false
                            };

                            await createZuntraBlog(draftPost);
                            generatedTitlesThisSession.push(aiResult.title);
                        } catch (postErr) {
                            console.error(`Error generating bulk post ${i}:`, postErr);
                            failedIndices.push(i);
                            if (onToast) onToast(`Post ${i} failed: ${postErr.message}`, 'error');
                        }
                    }

                    if (failedIndices.length > 0) {
                        if (onToast) {
                            onToast({
                                message: `${totalCount - failedIndices.length} of ${totalCount} drafts created. Some failed.`,
                                type: 'error',
                                action: {
                                    label: 'Retry failed',
                                    onClick: () => handleGenerateWithAI()
                                }
                            });
                        }
                    } else {
                        if (onToast) onToast('Drafts created. Add cover images before publishing.', 'success');
                    }

                    // Navigate to list view so user can open each one, add an image, and publish
                    if (onBulkComplete) {
                        await onBulkComplete();
                    } else if (onCancel) {
                        onCancel();
                    }
                } catch (bulkErr) {
                    console.error('Mode B bulk generation error:', bulkErr);
                    if (onToast) onToast('Failed during bulk generation: ' + bulkErr.message, 'error');
                } finally {
                    setIsGenerating(false);
                }
                return;
            }
        }

        setIsGenerating(true);
        const failedAngles = [];

        const userInputs = {
            title: title.trim(),
            subtitle: subtitle.trim(),
            subtopics: subtopics,
            tags: tags,
            content: content.trim()
        };

        try {
            for (let i = 1; i <= totalCount; i++) {
                if (totalCount > 1) {
                    if (onToast) onToast(`Generating ${i} of ${totalCount}...`, 'info');
                } else {
                    if (onToast) onToast('Generating blog post with AI...', 'info');
                }

                try {
                    const aiResult = await generateZuntraPostAI({
                        category,
                        userInputs,
                        angleIndex: i,
                        totalAngles: totalCount
                    });

                    const words = aiResult.content.trim().split(/\s+/).filter(Boolean).length;
                    const calculatedTime = `${Math.max(1, Math.ceil(words / 200))} MIN READ`;
                    const uniqueSlug = await generateUniqueSlug(aiResult.title, i === 1 ? initialBlog?.id : null);
                    const categoryColor = getCategoryDefaultColor(category);

                    const today = new Date();
                    const todayFormatted = today.toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                    });
                    const yyyyMmDd = today.toISOString().split('T')[0];

                    if (i === 1) {
                        // Fill the form fields in place for post 1 without overwriting user-provided values
                        if (!userInputs.title) {
                            setTitle(aiResult.title);
                            setSlug(uniqueSlug);
                        } else if (!slug) {
                            setSlug(uniqueSlug);
                        }

                        if (!userInputs.subtitle && aiResult.subtitle) {
                            setSubtitle(aiResult.subtitle);
                        }

                        if (userInputs.subtopics.length === 0 && aiResult.subtopics.length > 0) {
                            setSubtopics(aiResult.subtopics);
                        }

                        if (userInputs.tags.length === 0 && aiResult.tags.length > 0) {
                            setTags(aiResult.tags);
                        }

                        if (!userInputs.content && aiResult.content) {
                            setContent(aiResult.content);
                        }

                        // Fill standard metadata
                        setColor(categoryColor);
                        setAuthor('Zuntra Engineering');
                        setInputDate(yyyyMmDd);
                        setTime(calculatedTime);
                        setFeatured(false);
                        setPublished(false);
                        // image_url is NEVER generated or overwritten
                    } else {
                        // For subsequent variations, save directly into zuntra_blogs as drafts
                        const draftRecord = {
                            title: aiResult.title,
                            slug: uniqueSlug,
                            subtitle: aiResult.subtitle,
                            category,
                            subtopics: aiResult.subtopics.join(', '),
                            author: 'Zuntra Engineering',
                            date: todayFormatted,
                            time: calculatedTime,
                            color: categoryColor,
                            image_url: null, // user adds images themselves
                            tags: aiResult.tags.join(', '),
                            content: aiResult.content,
                            featured: false,
                            published: false
                        };
                        await createZuntraBlog(draftRecord);
                    }
                } catch (postErr) {
                    console.error(`Error generating post angle ${i}:`, postErr);
                    failedAngles.push(i);
                    if (onToast) onToast(`Post ${i} failed: ${postErr.message}`, 'error');
                }
            }

            if (failedAngles.length > 0) {
                if (onToast) {
                    onToast({
                        message: `${totalCount - failedAngles.length} of ${totalCount} generated. Some angles failed.`,
                        type: 'error',
                        action: {
                            label: 'Retry failed',
                            onClick: () => handleGenerateWithAI()
                        }
                    });
                }
            } else {
                if (totalCount > 1) {
                    if (onToast) onToast('Drafts created. Add cover images before publishing.', 'success');
                } else {
                    if (onToast) onToast('AI generated! Review fields and save when ready.', 'success');
                }
            }
        } catch (err) {
            console.error('AI generation error:', err);
            if (onToast) onToast('Failed to generate with AI: ' + err.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Form submission
    const handleSubmit = (publishStatus) => {
        const newErrors = {};

        if (!title.trim()) newErrors.title = 'Title is required';
        if (!slug.trim()) {
            newErrors.slug = 'Slug is required';
        } else if (!slugAvailable) {
            newErrors.slug = 'This slug is already in use';
        }
        if (!category) newErrors.category = 'Category is required';
        if (!content.trim()) newErrors.content = 'Content is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to the first error
            window.scrollTo({ top: 100, behavior: 'smooth' });
            return;
        }

        const blogData = {
            title: title.trim(),
            slug: slug.trim(),
            subtitle: subtitle.trim(),
            category,
            color,
            author: author.trim() || 'Zuntra Engineering',
            date: formatDateToDisplay(inputDate),
            time: time.trim() || '1 MIN READ',
            image_url: imageUrl.trim() || null,
            subtopics: subtopics.join(', '),
            tags: tags.join(', '),
            content,
            featured,
            published: publishStatus !== undefined ? publishStatus : published
        };

        onSave(blogData);
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Posts
                </button>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSubmit(false)}
                        disabled={isSaving || slugChecking || (!slugAvailable && !!slug)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                        <Save className="w-4 h-4 text-gray-500" />
                        Save Draft
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={isSaving || slugChecking || (!slugAvailable && !!slug)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold flex items-center gap-1.5 shadow-md"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {isEdit ? 'Update & Publish' : 'Save & Publish'}
                    </Button>
                </div>
            </div>

            {/* Title Section */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                    {isEdit ? 'Edit Post' : 'Create New Post'}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Fill in the numbered sections below to configure and publish for the Zuntra website.
                </p>
            </div>

            {/* 1. Basic Info */}
            <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-800">1. Basic Info</CardTitle>
                        <p className="text-xs text-gray-500">Title, slug URL, and brief overview subtitle.</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                            <span>Title <span className="text-red-500">*</span></span>
                            {errors.title && <span className="text-xs text-red-500 font-normal">{errors.title}</span>}
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g. Building enterprise technology systems that survive contact with reality"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={errors.title ? 'border-red-400 focus:ring-red-400' : ''}
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="slug" className="text-sm font-semibold text-gray-700">
                                Slug <span className="text-red-500">*</span>
                            </Label>
                            {slug && (
                                <div className="flex items-center gap-1 text-xs">
                                    {slugChecking ? (
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                                        </span>
                                    ) : slugAvailable ? (
                                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Slug available
                                        </span>
                                    ) : (
                                        <span className="text-red-500 flex items-center gap-1 font-medium">
                                            <XCircle className="w-3.5 h-3.5" /> Slug already exists
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono select-none">
                                /
                            </span>
                            <Input
                                id="slug"
                                placeholder="building-enterprise-tech"
                                value={slug}
                                onChange={(e) => {
                                    setSlug(e.target.value);
                                    setSlugManuallyEdited(true);
                                }}
                                className={`pl-7 font-mono text-xs ${
                                    errors.slug || (!slugChecking && !slugAvailable && slug)
                                        ? 'border-red-400 focus:ring-red-400'
                                        : ''
                                }`}
                            />
                        </div>
                        {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-1.5">
                        <Label htmlFor="subtitle" className="text-sm font-semibold text-gray-700">
                            Subtitle <span className="text-xs text-gray-400 font-normal">(optional summary)</span>
                        </Label>
                        <Textarea
                            id="subtitle"
                            rows={2}
                            placeholder="Enterprise development is less about code and more about organizational dynamics and scale."
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 2. Category and Display */}
            <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-800">2. Category and Display</CardTitle>
                        <p className="text-xs text-gray-500">Classification, custom branding tint, and author credits.</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Category Pill Buttons & Number of Blogs */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <Label className="text-sm font-semibold text-gray-700">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex flex-wrap gap-2.5">
                                {ZUNTRA_CATEGORIES.map((cat) => {
                                    const isSelected = category === cat.value;
                                    return (
                                        <button
                                            type="button"
                                            key={cat.value}
                                            onClick={() => handleCategorySelect(cat.value)}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border flex items-center gap-2 ${
                                                isSelected
                                                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs ring-2 ring-purple-600/30'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: cat.defaultColor }}
                                            />
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Number of Blogs */}
                        <div className="w-full sm:w-44 space-y-1.5 flex-shrink-0">
                            <Label htmlFor="numBlogs" className="text-sm font-semibold text-gray-700">
                                Number of Blogs
                            </Label>
                            <Input
                                id="numBlogs"
                                type="number"
                                min={1}
                                max={10}
                                value={numBlogs}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isNaN(val)) setNumBlogs('');
                                    else setNumBlogs(Math.max(1, Math.min(10, val)));
                                }}
                                className="text-xs h-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Color Picker & Hex Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="colorHex" className="text-sm font-semibold text-gray-700">
                                Tint Color
                            </Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    id="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                                />
                                <Input
                                    id="colorHex"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="font-mono text-xs uppercase"
                                    placeholder="#10B981"
                                />
                            </div>
                        </div>

                        {/* Author */}
                        <div className="space-y-1.5">
                            <Label htmlFor="author" className="text-sm font-semibold text-gray-700">
                                Author
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="author"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="pl-9 text-xs"
                                    placeholder="Zuntra Engineering"
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                                Date ({formatDateToDisplay(inputDate) || 'Today'})
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    id="date"
                                    value={inputDate}
                                    onChange={(e) => setInputDate(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Read Time */}
                        <div className="space-y-1.5">
                            <Label htmlFor="time" className="text-sm font-semibold text-gray-700">
                                Read Time
                            </Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="time"
                                    value={time}
                                    onChange={(e) => {
                                        setTime(e.target.value);
                                        setTimeManuallyEdited(true);
                                    }}
                                    className="pl-9 text-xs uppercase"
                                    placeholder="8 MIN READ"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Metadata */}
            <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-800">3. Metadata & Image</CardTitle>
                        <p className="text-xs text-gray-500">Cover photo URL, subtopics, and searchable tags.</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Image URL and Thumbnail */}
                    <div className="space-y-1.5">
                        <Label htmlFor="imageUrl" className="text-sm font-semibold text-gray-700">
                            Cover Image URL
                        </Label>
                        <div className="flex gap-3 items-start">
                            <div className="flex-1">
                                <Input
                                    id="imageUrl"
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={imageUrl}
                                    onChange={(e) => {
                                        setImageUrl(e.target.value);
                                        setImgPreviewError(false);
                                    }}
                                    className="text-xs"
                                />
                            </div>
                            {imageUrl && !imgPreviewError ? (
                                <img
                                    src={imageUrl}
                                    alt="Thumbnail preview"
                                    onError={() => setImgPreviewError(true)}
                                    className="w-16 h-10 rounded-lg object-cover border border-gray-200 shadow-xs flex-shrink-0"
                                />
                            ) : (
                                <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 flex-shrink-0">
                                    <Image className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Subtopics */}
                        <TagInput
                            label="Subtopics"
                            tags={subtopics}
                            onChange={setSubtopics}
                            placeholder="e.g. Enterprise Scale, System Architecture..."
                        />

                        {/* Tags */}
                        <TagInput
                            label="Tags"
                            tags={tags}
                            onChange={setTags}
                            placeholder="e.g. Reliability, Infrastructure..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 4. Content */}
            <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">4. Content</CardTitle>
                            <p className="text-xs text-gray-500">Markdown content with live side-by-side preview.</p>
                        </div>
                    </div>

                    {/* View Switcher for Editor / Preview */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setEditorTab('split')}
                            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                                editorTab === 'split' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Columns className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Side-by-side</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditorTab('edit')}
                            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                                editorTab === 'edit' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Code className="w-3.5 h-3.5" />
                            <span>Editor</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditorTab('preview')}
                            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                                editorTab === 'preview' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {errors.content && (
                        <p className="text-xs text-red-500 mb-1">{errors.content}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Editor Pane */}
                        {(editorTab === 'split' || editorTab === 'edit') && (
                            <div className={`space-y-1.5 ${editorTab === 'edit' ? 'md:col-span-2' : ''}`}>
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                                    <span>Markdown Source</span>
                                    <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                                </div>
                                <Textarea
                                    rows={18}
                                    placeholder="### Overview&#10;&#10;Write markdown content here...&#10;&#10;### Core Tenets&#10;- Bullet points&#10;- Code blocks, etc."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="font-mono text-xs leading-relaxed min-h-[360px]"
                                />
                            </div>
                        )}

                        {/* Live Preview Pane */}
                        {(editorTab === 'split' || editorTab === 'preview') && (
                            <div className={`space-y-1.5 ${editorTab === 'preview' ? 'md:col-span-2' : ''}`}>
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Live Rendered Preview
                                </div>
                                <div
                                    className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 min-h-[360px] max-h-[480px] overflow-y-auto prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900 prose-headings:font-bold prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5"
                                    dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 5. Publishing */}
            <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Send className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-800">5. Publishing Status</CardTitle>
                        <p className="text-xs text-gray-500">Configure visibility and placement on the website.</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Featured Switch */}
                        <div className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 bg-gray-50/50">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800">Featured Post</h4>
                                <p className="text-xs text-gray-500">Display prominently in featured sections</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={featured}
                                onClick={() => setFeatured(!featured)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                                    featured ? 'bg-purple-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        featured ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Published Switch */}
                        <div className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 bg-gray-50/50">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800">Published Live</h4>
                                <p className="text-xs text-gray-500">Make post visible to the public</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={published}
                                onClick={() => setPublished(!published)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                                    published ? 'bg-emerald-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        published ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Save Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isSaving || isGenerating}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGenerateWithAI}
                            disabled={isGenerating || isSaving}
                            className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-1.5"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            ) : (
                                <Sparkles className="w-4 h-4 text-purple-600" />
                            )}
                            Generate with AI
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSubmit(false)}
                            disabled={isSaving || isGenerating || slugChecking || (!slugAvailable && !!slug)}
                            className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"
                        >
                            <Save className="w-4 h-4 text-gray-500" />
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit(true)}
                            disabled={isSaving || slugChecking || (!slugAvailable && !!slug)}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {isEdit ? 'Update & Publish' : 'Save & Publish'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
