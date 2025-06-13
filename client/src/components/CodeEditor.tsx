import * as React from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SnippetFile } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

interface CodeEditorProps {
  files: SnippetFile[];
  readOnly?: boolean;
  onFileChange?: (updatedFile: SnippetFile) => void;
}

export function CodeEditor({ files, readOnly = false, onFileChange }: CodeEditorProps) {
  const [activeFile, setActiveFile] = React.useState<string>(files[0]?.id.toString() || '');
  
  const handleEditorChange = (value: string) => {
    if (!readOnly && onFileChange) {
      const fileToUpdate = files.find(file => file.id.toString() === activeFile);
      if (fileToUpdate) {
        onFileChange({
          ...fileToUpdate,
          content: value || ''
        });
      }
    }
  };
  
  // Get file extension to determine language
  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'go':
        return 'go';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
      case 'cc':
        return 'cpp';
      case 'cs':
        return 'csharp';
      default:
        return 'plaintext';
    }
  };
  
  const activeFileObj = files.find(file => file.id.toString() === activeFile);
  const language = activeFileObj 
    ? getLanguageFromFilename(activeFileObj.filename)
    : 'plaintext';
  
  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'light';
  
  return (
    <Card className="h-full flex flex-col">
      <Tabs 
        defaultValue={activeFile} 
        value={activeFile}
        onValueChange={setActiveFile}
        className="w-full h-full flex flex-col"
      >
        <TabsList className="w-full justify-start overflow-auto scrollbar-hide">
          {files.map((file) => (
            <TabsTrigger key={file.id} value={file.id.toString()} className="px-4">
              {file.filename}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {files.map((file) => (
          <TabsContent 
            key={file.id} 
            value={file.id.toString()}
            className="flex-grow data-[state=active]:flex data-[state=active]:flex-col"
          >
            <CardContent className="p-0 flex-grow">
              <Editor
                height="100%"
                language={getLanguageFromFilename(file.filename)}
                value={file.content}
                theme={theme}
                options={{
                  readOnly,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  tabSize: 2,
                  wordWrap: 'on'
                }}
                onChange={handleEditorChange}
                className="min-h-[300px]"
              />
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
