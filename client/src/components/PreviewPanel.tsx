import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { SnippetFile } from '@/lib/api';

interface PreviewPanelProps {
  files: SnippetFile[];
  expanded: boolean;
  onToggleExpand: () => void;
}

export function PreviewPanel({ files, expanded, onToggleExpand }: PreviewPanelProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Check if we have HTML files to render
  const hasHtml = files.some(file => file.filename.endsWith('.html'));
  
  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Combine all files content to build a complete HTML document
  const getPreviewContent = (): string => {
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';
    
    // First, find the HTML file
    const htmlFile = files.find(file => file.filename.endsWith('.html'));
    if (htmlFile) {
      htmlContent = htmlFile.content;
    } else {
      // If no HTML file, create a basic one
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style id="preview-css"></style>
</head>
<body>
  <div id="preview-content">
    <p>No HTML content to display</p>
  </div>
  <script id="preview-js"></script>
</body>
</html>`;
    }
    
    // Find CSS files
    const cssFiles = files.filter(file => file.filename.endsWith('.css'));
    cssFiles.forEach(file => {
      cssContent += file.content + '\n';
    });
    
    // Find JS files
    const jsFiles = files.filter(file => file.filename.endsWith('.js'));
    jsFiles.forEach(file => {
      jsContent += file.content + '\n';
    });
    
    // Insert CSS into HTML
    if (cssContent && !htmlContent.includes('<style id="preview-css">')) {
      // If there's no style tag with preview-css id, add it to the head
      htmlContent = htmlContent.replace('</head>', `<style id="preview-css">${cssContent}</style></head>`);
    } else if (cssContent) {
      // Replace existing style tag content
      htmlContent = htmlContent.replace(/<style id="preview-css">.*?<\/style>/s, `<style id="preview-css">${cssContent}</style>`);
    }
    
    // Insert JS into HTML
    if (jsContent && !htmlContent.includes('<script id="preview-js">')) {
      // If there's no script tag with preview-js id, add it to the end of body
      htmlContent = htmlContent.replace('</body>', `<script id="preview-js">${jsContent}</script></body>`);
    } else if (jsContent) {
      // Replace existing script tag content
      htmlContent = htmlContent.replace(/<script id="preview-js">.*?<\/script>/s, `<script id="preview-js">${jsContent}</script>`);
    }
    
    return htmlContent;
  };
  
  // Set the content of the iframe
  React.useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const content = getPreviewContent();
      
      // Write to the iframe
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(content);
        doc.close();
      }
    }
  }, [files, refreshKey]);
  
  return (
    <Card className={`flex flex-col ${expanded ? 'fixed inset-0 z-50 m-4 rounded-xl' : 'h-full'}`}>
      <div className="flex items-center justify-between border-b p-2">
        <h3 className="text-sm font-medium">Live Preview</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={refreshPreview}
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleExpand}
            title={expanded ? 'Minimize' : 'Maximize'}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <CardContent className="flex-grow p-0">
        {hasHtml ? (
          <iframe 
            ref={iframeRef}
            title="Code Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-modals"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <p>Add an HTML file to see a live preview</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
