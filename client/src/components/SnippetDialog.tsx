import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language, Snippet } from '@/lib/api';

interface SnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippet: Partial<Snippet> | null;
  languages: Language[];
  onSave: (snippet: Partial<Snippet>) => void;
}

export function SnippetDialog({ open, onOpenChange, snippet, languages, onSave }: SnippetDialogProps) {
  const [title, setTitle] = React.useState('');
  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [languageId, setLanguageId] = React.useState<string>("none");
  
  // Reset form when the dialog opens or the snippet changes
  React.useEffect(() => {
    if (snippet) {
      setTitle(snippet.title || '');
      setCode(snippet.code || '');
      setDescription(snippet.description || '');
      setLanguageId(snippet.language_id ? String(snippet.language_id) : "none");
    } else {
      setTitle('');
      setCode('');
      setDescription('');
      setLanguageId("none");
    }
  }, [snippet]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...snippet,
      title,
      code,
      description: description || null,
      language_id: languageId && languageId !== "none" ? parseInt(languageId) : null,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{snippet?.id ? 'Edit Snippet' : 'Add New Snippet'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="language" className="text-right">
                Language
              </Label>
              <Select
                value={languageId}
                onValueChange={setLanguageId}
              >
                <SelectTrigger id="language" className="col-span-3">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={String(language.id)}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="col-span-3 min-h-[200px] font-mono"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
