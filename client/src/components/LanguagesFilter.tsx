import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Language } from '@/lib/api';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LanguagesFilterProps {
  languages: Language[];
  selectedLanguageId: number | null;
  onLanguageSelect: (languageId: number | null) => void;
  onAddLanguage: (name: string) => void;
}

export function LanguagesFilter({ 
  languages, 
  selectedLanguageId, 
  onLanguageSelect, 
  onAddLanguage 
}: LanguagesFilterProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newLanguageName, setNewLanguageName] = React.useState('');

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLanguageName.trim()) {
      onAddLanguage(newLanguageName.trim());
      setNewLanguageName('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Filter by Language</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
          className="h-8"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Language
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedLanguageId === null ? "default" : "outline"}
          size="sm"
          onClick={() => onLanguageSelect(null)}
          className="h-8"
        >
          All
        </Button>
        
        {languages.map((language) => (
          <Button
            key={language.id}
            variant={selectedLanguageId === language.id ? "default" : "outline"}
            size="sm"
            onClick={() => onLanguageSelect(language.id)}
            className="h-8"
          >
            {language.name}
          </Button>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddLanguage}>
            <DialogHeader>
              <DialogTitle>Add New Language</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Language Name
                </Label>
                <Input
                  id="name"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. JavaScript, Python, etc."
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Language</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
