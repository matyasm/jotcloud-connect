
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { LogOut, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const { user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleSearch = () => setSearchOpen(!searchOpen);

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4 md:py-6 relative">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/notes" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                JotCloud
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/notes" 
              className="text-gray-700 hover:text-blue-600 font-medium text-sm transition duration-150 ease-in-out"
            >
              My Notes
            </Link>
            <Link 
              to="/shared" 
              className="text-gray-700 hover:text-blue-600 font-medium text-sm transition duration-150 ease-in-out"
            >
              Shared
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSearch}
              className="text-gray-700 hover:text-blue-600"
            >
              <Search size={20} />
            </Button>
            
            <Button
              onClick={logout}
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:text-blue-600"
            >
              <LogOut size={20} />
            </Button>
            
            {/* User avatar with first letter */}
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSearch}
              className="mr-2 text-gray-700"
            >
              <Search size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-gray-700"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-4 py-3 space-y-3 bg-white border-b border-gray-100">
            <Link 
              to="/notes" 
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              My Notes
            </Link>
            <Link 
              to="/shared" 
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Shared
            </Link>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium mr-2">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-600">{user?.name}</span>
              </div>
              <Button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                variant="ghost"
                size="icon"
                className="text-gray-700"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 shadow-sm animate-fade-in">
          <SearchBar onClose={toggleSearch} />
        </div>
      )}
    </header>
  );
};

export default Navbar;
