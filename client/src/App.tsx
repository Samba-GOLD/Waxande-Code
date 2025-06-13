import * as React from 'react';
import { Header } from '@/components/Header';
import { SnippetCard } from '@/components/SnippetCard';
import { SnippetDialog } from '@/components/SnippetDialog';
import { LanguagesFilter } from '@/components/LanguagesFilter';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Snippet, Language, getSnippets, getLanguages, createSnippet, updateSnippet, deleteSnippet, createLanguage } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginDialog } from '@/components/LoginDialog';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [snippets, setSnippets] = React.useState<Snippet[]>([]);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSnippetDialogOpen, setIsSnippetDialogOpen] = React.useState(false);
  const [currentSnippet, setCurrentSnippet] = React.useState<Partial<Snippet> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [snippetToDelete, setSnippetToDelete] = React.useState<Snippet | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);

  // Load initial data when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      // Clear data when not authenticated
      setSnippets([]);
      setLanguages([]);
    }
  }, [isAuthenticated]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      
      const [snippetsData, languagesData] = await Promise.all([
        getSnippets(),
        getLanguages()
      ]);
      
      setSnippets(snippetsData);
      setLanguages(languagesData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }

  // Function to handle snippet filtering
  const loadFilteredSnippets = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const filteredSnippets = await getSnippets({
        language_id: selectedLanguageId,
        search: searchTerm
      });
      
      setSnippets(filteredSnippets);
    } catch (err) {
      console.error('Failed to load filtered snippets:', err);
      setError('Failed to apply filters. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters when selection changes
  React.useEffect(() => {
    if (isAuthenticated) {
      loadFilteredSnippets();
    }
  }, [selectedLanguageId, isAuthenticated]);

  // Handle search
  const handleSearch = () => {
    if (!isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }
    loadFilteredSnippets();
  };

  // Handle adding a new snippet
  const handleAddSnippet = () => {
    if (!isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }
    setCurrentSnippet({});
    setIsSnippetDialogOpen(true);
  };

  // Handle editing a snippet
  const handleEditSnippet = (snippet: Snippet) => {
    if (!isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }
    setCurrentSnippet(snippet);
    setIsSnippetDialogOpen(true);
  };

  // Handle saving a snippet (create or update)
  const handleSaveSnippet = async (snippetData: Partial<Snippet>) => {
    try {
      setError(null);
      
      let savedSnippet: Snippet;
      
      if (snippetData.id) {
        // Update existing snippet
        savedSnippet = await updateSnippet(
          snippetData.id,
          {
            title: snippetData.title!,
            description: snippetData.description,
            language_id: snippetData.language_id,
            files: [
              {
                filename: 'snippet.txt',
                content: snippetData.code!,
                language_id: snippetData.language_id
              }
            ]
          }
        );
        
        // Update the snippets list
        setSnippets(prevSnippets =>
          prevSnippets.map(s => (s.id === savedSnippet.id ? savedSnippet : s))
        );
      } else {
        // Create new snippet
        savedSnippet = await createSnippet({
          title: snippetData.title!,
          description: snippetData.description,
          language_id: snippetData.language_id,
          files: [
            {
              filename: 'snippet.txt',
              content: snippetData.code!,
              language_id: snippetData.language_id
            }
          ]
        });
        
        // Add to the snippets list
        setSnippets(prevSnippets => [savedSnippet, ...prevSnippets]);
      }
      
      setIsSnippetDialogOpen(false);
    } catch (err) {
      console.error('Failed to save snippet:', err);
      setError('Failed to save snippet. Please try again.');
    }
  };

  // Handle deleting a snippet
  const handleDeleteSnippet = (snippet: Snippet) => {
    if (!isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }
    setSnippetToDelete(snippet);
    setIsDeleteDialogOpen(true);
  };

  // Confirm snippet deletion
  const confirmDeleteSnippet = async () => {
    if (!snippetToDelete) return;
    
    try {
      setError(null);
      await deleteSnippet(snippetToDelete.id);
      
      // Remove from the snippets list
      setSnippets(prevSnippets => 
        prevSnippets.filter(s => s.id !== snippetToDelete.id)
      );
      
      setIsDeleteDialogOpen(false);
      setSnippetToDelete(null);
    } catch (err) {
      console.error('Failed to delete snippet:', err);
      setError('Failed to delete snippet. Please try again.');
    }
  };

  // Handle adding a new language
  const handleAddLanguage = async (name: string) => {
    if (!isAuthenticated) {
      setIsLoginDialogOpen(true);
      return;
    }
    
    try {
      setError(null);
      const newLanguage = await createLanguage(name);
      
      // Add to the languages list
      setLanguages(prevLanguages => [...prevLanguages, newLanguage]);
    } catch (err) {
      console.error('Failed to add language:', err);
      setError('Failed to add language. It might already exist.');
    }
  };

  // Handle language filter change
  const handleLanguageSelect = (languageId: number | null) => {
    setSelectedLanguageId(languageId);
  };

  // Handle opening login dialog
  const handleOpenLogin = () => {
    setIsLoginDialogOpen(true);
  };

  // If still checking authentication status, show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  // Main application view (always accessible)
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onAddSnippet={handleAddSnippet} 
        onSearch={handleSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenLogin={handleOpenLogin}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isAuthenticated && (
          <LanguagesFilter 
            languages={languages}
            selectedLanguageId={selectedLanguageId}
            onLanguageSelect={handleLanguageSelect}
            onAddLanguage={handleAddLanguage}
          />
        )}
        
        {!isAuthenticated ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">Welcome to CodeLibrary</h3>
            <p className="text-muted-foreground mb-4">
              Store and manage your code snippets in one place. Create an account to get started.
            </p>
            <button 
              onClick={handleOpenLogin}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              Get Started
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading snippets...</p>
          </div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">No snippets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedLanguageId
                ? "Try changing your search criteria or filter."
                : "Start building your code library by adding your first snippet."}
            </p>
            <button 
              onClick={handleAddSnippet}
              className="text-primary hover:underline"
            >
              Add your first snippet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {snippets.map(snippet => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onEdit={handleEditSnippet}
                onDelete={handleDeleteSnippet}
              />
            ))}
          </div>
        )}
      </main>
      
      {isAuthenticated && (
        <>
          <SnippetDialog 
            open={isSnippetDialogOpen}
            onOpenChange={setIsSnippetDialogOpen}
            snippet={currentSnippet}
            languages={languages}
            onSave={handleSaveSnippet}
          />
          
          <DeleteConfirmDialog 
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="Delete Snippet"
            description={`Are you sure you want to delete "${snippetToDelete?.title}"? This action cannot be undone.`}
            onConfirm={confirmDeleteSnippet}
          />
        </>
      )}
      
      <LoginDialog 
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />
    </div>
  );
}

export default App;