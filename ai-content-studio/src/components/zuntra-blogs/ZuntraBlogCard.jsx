import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Newspaper, Clock, User, Calendar, Edit, Eye, Copy, Trash2 } from 'lucide-react';
import { getCategoryDefaultColor } from '../../services/zuntraBlogService';

export default function ZuntraBlogCard({
    blog,
    onToggle,
    onEdit,
    onPreview,
    onDuplicate,
    onDelete,
    actionLoading
}) {
    const [imgError, setImgError] = useState(false);
    const categoryColor = blog.color || getCategoryDefaultColor(blog.category);

    return (
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white">
            <CardContent className="p-4 space-y-4">
                <div className="flex gap-3">
                    {blog.image_url && !imgError ? (
                        <img
                            src={blog.image_url}
                            alt={blog.title}
                            onError={() => setImgError(true)}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 flex-shrink-0 border border-gray-100">
                            <Newspaper className="w-7 h-7 opacity-60" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border whitespace-nowrap"
                                style={{
                                    backgroundColor: `${categoryColor}18`,
                                    color: categoryColor,
                                    borderColor: `${categoryColor}40`,
                                }}
                            >
                                {blog.category}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                            {blog.title}
                        </h3>
                    </div>
                </div>

                {blog.subtitle && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {blog.subtitle}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {blog.author || 'Zuntra Engineering'}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {blog.date || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {blog.time || '—'}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={blog.featured}
                                onClick={() => onToggle(blog.id, 'featured', !blog.featured)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-1 ${
                                    blog.featured ? 'bg-purple-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        blog.featured ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                            <span className="text-xs font-medium text-gray-600">Featured</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={blog.published}
                                onClick={() => onToggle(blog.id, 'published', !blog.published)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
                                    blog.published ? 'bg-emerald-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        blog.published ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                            <span className="text-xs font-medium text-gray-600">Published</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPreview(blog)}
                            title="Preview"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onEdit(blog)}
                            title="Edit"
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDuplicate(blog)}
                            title="Duplicate"
                            disabled={actionLoading}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(blog)}
                            title="Delete"
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
