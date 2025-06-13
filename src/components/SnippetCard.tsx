import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Snippet } from '@/lib/api';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SnippetCardProps {
  snippet: Snippet;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, onEdit, onDelete }: SnippetCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{snippet.title}</CardTitle>
            {snippet.language_name && (
              <CardDescription className="mt-1">
                {snippet.language_name}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy code">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(snippet)} title="Edit snippet">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(snippet)} title="Delete snippet">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        {snippet.description && (
          <p className="text-sm text-muted-foreground mb-2">{snippet.description}</p>
        )}
        <div className="relative bg-muted rounded-md p-3 overflow-auto max-h-64">
          <pre className="text-xs">
            <code>{snippet.code}</code>
          </pre>
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="w-full flex justify-between">
          <span>Created: {formatDate(snippet.created_at)}</span>
          <span>Updated: {formatDate(snippet.updated_at)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}