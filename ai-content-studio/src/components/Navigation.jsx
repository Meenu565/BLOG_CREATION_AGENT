import { Link, NavLink } from 'react-router-dom';
import { PenTool, Library, Newspaper } from 'lucide-react';

export default function Navigation() {
    const navLinkClass = ({ isActive }) =>
        `${isActive ? 'text-blue-600 font-semibold bg-blue-50/60' : 'text-gray-700 hover:text-blue-600 font-medium'} px-3 py-2 rounded-md flex items-center transition-colors`;

    return (
        <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex">
                        <Link to="/" className="flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 inline-block text-transparent bg-clip-text">
                            <PenTool className="h-6 w-6 mr-2 text-blue-600" />
                            AI Content Studio
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <NavLink to="/generator" className={navLinkClass}>
                            Generator
                        </NavLink>
                        <NavLink to="/zuntra-blogs" className={navLinkClass}>
                            <Newspaper className="h-4 w-4 mr-2" />
                            Zuntra Blogs
                        </NavLink>
                        <NavLink to="/drafts" className={navLinkClass}>
                            <Library className="h-4 w-4 mr-2" />
                            My Blogs
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
}
