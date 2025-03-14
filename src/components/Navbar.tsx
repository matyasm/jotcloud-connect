
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { LogOut, Search, Menu, X, KeyRound } from "lucide-react";
import { useState } from "react";
import SearchBar from "./SearchBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PasswordChangeForm from "./PasswordChangeForm";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleSearch = () => setSearchOpen(!searchOpen);

  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4 md:py-6 relative">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/notes" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
                Notifly
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/notes" 
              className="text-foreground hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition duration-150 ease-in-out"
            >
              My Notes
            </Link>
            <Link 
              to="/shared" 
              className="text-foreground hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition duration-150 ease-in-out"
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
              className="text-foreground hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Search size={20} />
            </Button>
            
            <ThemeToggle />
            
            {/* User profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-medium cursor-pointer">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSearch}
              className="mr-2 text-foreground"
            >
              <Search size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-foreground"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-4 py-3 space-y-3 bg-background border-b border-border">
            <Link 
              to="/notes" 
              className="block py-2 text-foreground hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              My Notes
            </Link>
            <Link 
              to="/shared" 
              className="block py-2 text-foreground hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Shared
            </Link>
            <div className="pt-2 border-t border-border space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => {
                  setMenuOpen(false);
                  setIsPasswordDialogOpen(true);
                }}
              >
                <KeyRound size={18} className="mr-2" />
                Change Password
              </Button>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-medium mr-2">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground">{user?.name}</span>
                </div>
                <div className="flex items-center">
                  <ThemeToggle />
                  <Button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-foreground"
                  >
                    <LogOut size={20} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 shadow-sm animate-fade-in">
          <SearchBar onClose={toggleSearch} />
        </div>
      )}

      {/* Password change dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <PasswordChangeForm onClose={() => setIsPasswordDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;
