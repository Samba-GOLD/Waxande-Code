import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Code, Search, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onAddSnippet: () => void;
  onSearch: (term: string) => void;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onOpenLogin: () => void;
}

export function Header({ onAddSnippet, onSearch, searchTerm, setSearchTerm, onOpenLogin }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6" />
            <h1 className="text-2xl font-bold">CodeLibrary</h1>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-auto sm:max-w-sm gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search snippets..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {user && (
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    {user.username}
                  </span>
                )}
                <Button onClick={onAddSnippet}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Snippet
                </Button>
                <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={onOpenLogin} variant="default">
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}