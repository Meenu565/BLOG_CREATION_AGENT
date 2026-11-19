import React, { useState } from 'react';
import { Newspaper, Edit, Eye, Copy, Trash2, Clock, User, Calendar } from 'lucide-react';
import { getCategoryDefaultColor } from '../../services/zuntraBlogService';

export default function ZuntraBlogTable({
    blogs,
    onToggle,
    onEdit,
    onPreview,
    onDuplicate,
    onDelete,
    actionLoading
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="py-3.5 px-4 w-16">Thumbnail</th>
                            <th className="py-3.5 px-4 min-w-[240px]">Title & Subtitle</th>
                            <th className="py-3.5 px-4 w-36">Category</th>
                            <th className="py-3.5 px-4 w-36">Author</th>
                            <th className="py-3.5 px-4 w-28">Date</th>
                            <th className="py-3.5 px-4 w-28">Read Time</th>
                            <th className="py-3.5 px-4 text-center w-24">Featured</th>
                            <th className="py-3.5 px-4 text-center w-24">Published</th>
                            <th className="py-3.5 px-4 text-right w-36">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {blogs.map((blog) => (
                            <TableRow
                                key={blog.id}
                                blog={blog}
                                onToggle={onToggle}
                                onEdit={onEdit}
                                onPreview={onPreview}
                                onDuplicate={onDuplicate}
                                onDelete={onDelete}
                                actionLoading={actionLoading}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TableRow({
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
        <tr className="hover:bg-blue-50/30 transition-colors">
            {/* Thumbnail */}
            <td className="py-3 px-4">
                {blog.image_url && !imgError ? (
                    <img
                        src={blog.image_url}
                        alt={blog.title}
                        onError={() => setImgError(true)}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-xs"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 border border-gray-100 shadow-xs">
                        <Newspaper className="w-5 h-5 opacity-60" />
                    </div>
                )}
            </td>

            {/* Title and Subtitle */}
            <td className="py-3 px-4">
                <div className="font-semibold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onPreview(blog)}>
                    {blog.title}
                </div>
                {blog.subtitle && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {blog.subtitle}
                    </p>
                )}
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    /{blog.slug}
                </div>
            </td>

            {/* Category */}
            <td className="py-3 px-4">
                <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border whitespace-nowrap"
                    style={{
                        backgroundColor: `${categoryColor}18`,
                        color: categoryColor,
                        borderColor: `${categoryColor}40`,
                    }}
                >
                    {blog.category}
                </span>
            </td>

            {/* Author */}
            <td className="py-3 px-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{blog.author || 'Zuntra Engineering'}</span>
                </div>
            </td>

            {/* Date */}
            <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{blog.date || '—'}</span>
                </div>
            </td>

            {/* Read Time */}
            <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{blog.time || '—'}</span>
                </div>
            </td>

            {/* Featured Toggle */}
            <td className="py-3 px-4 text-center">
                <button
                    type="button"
                    role="switch"
                    aria-checked={blog.featured}
                    aria-label={`Toggle featured for ${blog.title}`}
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
            </td>

            {/* Published Toggle */}
            <td className="py-3 px-4 text-center">
                <button
                    type="button"
                    role="switch"
                    aria-checked={blog.published}
                    aria-label={`Toggle published for ${blog.title}`}
                    onClick={() => onToggle(blog.id, 'published', !blog.published)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1 ${
                        blog.published ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            blog.published ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                </button>
            </td>

            {/* Actions */}
            <td className="py-3 px-4 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1 justify-end">
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
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
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
            </td>
        </tr>
    );
}
