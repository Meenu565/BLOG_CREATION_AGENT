import React, { useState, useEffect, useMemo } from 'react';
import { Newspaper, Plus, Search, Filter, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    getZuntraBlogs,
    updateZuntraBlogToggle,
    deleteZuntraBlog,
    duplicateZuntraBlog,
    createZuntraBlog,
    updateZuntraBlog,
    ZUNTRA_CATEGORIES
} from '../services/zuntraBlogService';
import ZuntraBlogTable from '../components/zuntra-blogs/ZuntraBlogTable';
import ZuntraBlogCard from '../components/zuntra-blogs/ZuntraBlogCard';
import ZuntraBlogForm from '../components/zuntra-blogs/ZuntraBlogForm';
import Toast from '../components/zuntra-blogs/Toast';

const STATUS_FILTERS = [
    { value: 'ALL', label: 'All' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'FEATURED', label: 'Featured' },
];

export default function ZuntraBlogsPage() {
    // View state: 'list' | 'form'
    const [viewMode, setViewMode] = useState('list');
    const [editingBlog, setEditingBlog] = useState(null);

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [toast, setToast] = useState(null);

    // Delete confirmation modal state
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadBlogs();
    }, []);

    const showToast = (messageOrObj, type = 'info') => {
        if (typeof messageOrObj === 'object' && messageOrObj !== null) {
            setToast(messageOrObj);
        } else {
            setToast({ message: messageOrObj, type });
        }
    };

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const data = await getZuntraBlogs();
            setBlogs(data);
        } catch (err) {
            console.error('Failed to load Zuntra blogs:', err);
            showToast('Failed to load blogs: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter blogs based on search query, category, and status
    const filteredBlogs = useMemo(() => {
        return blogs.filter((blog) => {
            // Category filter
            if (selectedCategory !== 'ALL' && blog.category !== selectedCategory) {
                return false;
            }

            // Status filter
            if (selectedStatus === 'PUBLISHED' && !blog.published) return false;
            if (selectedStatus === 'DRAFT' && blog.published) return false;
            if (selectedStatus === 'FEATURED' && !blog.featured) return false;

            // Search filter (title, slug, tags)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchesTitle = blog.title?.toLowerCase().includes(query);
                const matchesSlug = blog.slug?.toLowerCase().includes(query);
                const matchesTags = blog.tags?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesSlug && !matchesTags) {
                    return false;
                }
            }

            return true;
        });
    }, [blogs, selectedCategory, selectedStatus, searchQuery]);

    // Inline toggle with optimistic UI update and revert on error
    const handleToggle = async (id, field, newValue) => {
        const previousBlogs = [...blogs];

        // 1. Optimistic local update
        setBlogs(prev =>
            prev.map(b => (b.id === id ? { ...b, [field]: newValue } : b))
        );

        // 2. Perform Supabase update
        try {
            await updateZuntraBlogToggle(id, field, newValue);
            const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
            showToast(`${fieldLabel} updated to ${newValue ? 'ON' : 'OFF'}`, 'success');
        } catch (err) {
            console.error(`Error updating ${field}:`, err);
            // Revert state
            setBlogs(previousBlogs);
            showToast(`Failed to update ${field}: ${err.message}`, 'error');
        }
    };

    // Duplicate post
    const handleDuplicate = async (blog) => {
        setActionLoading(true);
        try {
            const newBlog = await duplicateZuntraBlog(blog);
            setBlogs(prev => [newBlog, ...prev]);
            showToast(`Duplicated as "${newBlog.title}"`, 'success');
        } catch (err) {
            console.error('Failed to duplicate:', err);
            showToast('Failed to duplicate post: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!blogToDelete) return;
        setIsDeleting(true);
        try {
            await deleteZuntraBlog(blogToDelete.id);
            setBlogs(prev => prev.filter(b => b.id !== blogToDelete.id));
            showToast('Post deleted successfully', 'success');
            setBlogToDelete(null);
        } catch (err) {
            console.error('Failed to delete post:', err);
            showToast('Failed to delete post: ' + err.message, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNewPost = () => {
        setEditingBlog(null);
        setViewMode('form');
    };

    const handleEdit = (blog) => {
        setEditingBlog(blog);
        setViewMode('form');
    };

    const handleSaveForm = async (blogData) => {
        setIsSaving(true);
        try {
            if (editingBlog?.id) {
                // Update
                const updated = await updateZuntraBlog(editingBlog.id, blogData);
                setBlogs(prev => prev.map(b => b.id === updated.id ? updated : b));
                showToast(`"${updated.title}" updated successfully!`, 'success');
            } else {
                // Create
                const created = await createZuntraBlog(blogData);
                setBlogs(prev => [created, ...prev]);
                showToast(`"${created.title}" created successfully!`, 'success');
            }
            setViewMode('list');
            setEditingBlog(null);
        } catch (err) {
            console.error('Failed to save blog:', err);
            showToast('Failed to save blog: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkComplete = async () => {
        await loadBlogs();
        setViewMode('list');
        setEditingBlog(null);
    };

    const handlePreview = (blog) => {
        showToast(`Preview modal for "${blog.title}" will be available in Step 5!`, 'info');
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
            {viewMode === 'form' ? (
                <ZuntraBlogForm
                    initialBlog={editingBlog}
                    onSave={handleSaveForm}
                    onCancel={() => {
                        setViewMode('list');
                        setEditingBlog(null);
                    }}
                    isSaving={isSaving}
                    onToast={showToast}
                    existingBlogs={blogs}
                    onBulkComplete={handleBulkComplete}
                />
            ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-6">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 inline-block text-transparent bg-clip-text">
                                Zuntra Blogs
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Manage posts for the Zuntra website.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={loadBlogs}
                                variant="secondary"
                                size="sm"
                                disabled={loading}
                                className="text-gray-600 hover:text-gray-900 border border-gray-200 bg-white"
                                title="Refresh blogs"
                            >
                                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                onClick={handleNewPost}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md font-semibold flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                + New Post
                            </Button>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-xs">
                        {/* Search & Status Controls */}
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                            {/* Search box */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by title, slug, or tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-8 bg-gray-50/50 border-gray-200 focus:bg-white text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status filter buttons */}
                            <div className="flex items-center gap-1 self-start md:self-auto bg-gray-100 p-1 rounded-lg">
                                <span className="text-xs font-semibold text-gray-400 px-2 flex items-center gap-1">
                                    <Filter className="w-3 h-3" /> Status:
                                </span>
                                {STATUS_FILTERS.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => setSelectedStatus(status.value)}
                                        className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all ${
                                            selectedStatus === status.value
                                                ? 'bg-white text-purple-700 shadow-xs font-semibold'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto pb-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 mr-1">
                                Category:
                            </span>

                            {/* ALL pill */}
                            <button
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border whitespace-nowrap ${
                                    selectedCategory === 'ALL'
                                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs ring-1 ring-purple-600'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                ALL
                            </button>

                            {/* Fixed category pills */}
                            {ZUNTRA_CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => setSelectedCategory(cat.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                                            isSelected
                                                ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs ring-1 ring-purple-600'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cat.defaultColor }}
                                        />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Section: Skeletons / List / Empty State */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((n) => (
                                <div
                                    key={n}
                                    className="bg-white p-4 rounded-xl border border-gray-200 animate-pulse flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded-full w-24" />
                                    <div className="h-5 bg-gray-200 rounded-full w-10" />
                                    <div className="h-5 bg-gray-200 rounded-full w-10" />
                                </div>
                            ))}
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-200 bg-white shadow-xs">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                    <Newspaper className="h-8 w-8 opacity-60" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {blogs.length === 0 ? 'No posts yet' : 'No matching posts found'}
                                </h3>
                                <p className="text-gray-500 text-sm max-w-sm mb-6">
                                    {blogs.length === 0
                                        ? 'Get started by creating your first blog post for the Zuntra website.'
                                        : 'Try adjusting your search query, category, or status filters.'}
                                </p>
                                {blogs.length === 0 ? (
                                    <Button
                                        onClick={handleNewPost}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                                    >
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Create your first post
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('ALL');
                                            setSelectedStatus('ALL');
                                        }}
                                    >
                                        Reset all filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                <ZuntraBlogTable
                                    blogs={filteredBlogs}
                                    onToggle={handleToggle}
                                    onEdit={handleEdit}
                                    onPreview={handlePreview}
                                    onDuplicate={handleDuplicate}
                                    onDelete={(blog) => setBlogToDelete(blog)}
                                    actionLoading={actionLoading}
                                />
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {filteredBlogs.map((blog) => (
                                    <ZuntraBlogCard
                                        key={blog.id}
                                        blog={blog}
                                        onToggle={handleToggle}
                                        onEdit={handleEdit}
                                        onPreview={handlePreview}
                                        onDuplicate={handleDuplicate}
                                        onDelete={(blog) => setBlogToDelete(blog)}
                                        actionLoading={actionLoading}
                                    />
                                ))}
                            </div>

                            <div className="text-xs text-gray-500 text-right pr-2">
                                Showing {filteredBlogs.length} of {blogs.length} post{blogs.length === 1 ? '' : 's'}
                            </div>
                        </>
                    )}

                    {/* Delete Confirmation Modal */}
                    {blogToDelete && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
                                <div className="flex items-center gap-3 text-red-600">
                                    <div className="p-2.5 bg-red-100 rounded-lg">
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Delete Blog Post</h3>
                                        <p className="text-xs text-gray-500">This action cannot be undone.</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Are you sure you want to permanently delete{' '}
                                    <span className="font-semibold text-gray-900">
                                        &ldquo;{blogToDelete.title}&rdquo;
                                    </span>
                                    ?
                                </p>

                                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setBlogToDelete(null)}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Toast Notification */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>
    );
}
