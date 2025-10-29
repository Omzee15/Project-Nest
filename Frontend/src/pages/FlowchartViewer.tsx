import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  ArrowLeft,
  Save,
  FolderOpen,
  Loader2,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Project } from '@/types';
import { useAutoSave } from '@/hooks/use-auto-save';
import mermaid from 'mermaid';

export function FlowchartViewer() {
  const [flowchartContent, setFlowchartContent] = useState(`flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    D --> B
    B ---->|No| E[End]`);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const mermaidRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  // Load project if projectId is provided in URL params
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    console.log('useEffect triggered - projectId from URL:', projectId);
    console.log('searchParams:', searchParams.toString());
    if (projectId) {
      console.log('Loading project flowchart for projectId:', projectId);
      loadProjectFlowchart(projectId);
    } else {
      console.log('No projectId found in URL parameters');
    }
  }, [searchParams]);

  const loadProjectFlowchart = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      const response = await apiService.getProject(projectId);
      const project = response.data;
      console.log('Loaded project:', project);
      console.log('Project flowchart content:', project.flowchart_content);
      setCurrentProject(project);
      
      if (project.flowchart_content) {
        console.log('Setting flowchart content:', project.flowchart_content);
        setFlowchartContent(project.flowchart_content);
        setShowDiagram(true);
      } else {
        console.log('No flowchart content found in project');
      }
    } catch (error) {
      console.error('Failed to load project flowchart:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project flowchart.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProject(false);
    }
  };

  const saveProjectFlowchart = async () => {
    if (!currentProject) return;
    
    try {
      setIsSaving(true);
      console.log('Saving flowchart content:', flowchartContent);
      console.log('Project UID:', currentProject.project_uid);
      
      await apiService.partialUpdateProject(currentProject.project_uid, {
        flowchart_content: flowchartContent
      });
      
      console.log('Flowchart content saved successfully');
      
      toast({
        title: 'Success',
        description: 'Flowchart saved to project.',
      });
    } catch (error) {
      console.error('Failed to save project flowchart:', error);
      toast({
        title: 'Error',
        description: 'Failed to save flowchart.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save functionality for flowchart content
  const autoSave = useAutoSave(
    flowchartContent,
    async (content: string) => {
      if (!currentProject) return;
      
      console.log('Auto-saving flowchart content:', content);
      
      await apiService.partialUpdateProject(currentProject.project_uid, {
        flowchart_content: content
      });
      
      console.log('Auto-save completed');
    },
    {
      delay: 2000,
      enabled: !!currentProject && currentProject.project_uid !== ''
    }
  );

  const renderMermaidDiagram = useCallback(async () => {
    if (!flowchartContent.trim() || !mermaidRef.current) return;
    
    setIsRendering(true);
    try {
      // Clear previous diagram
      mermaidRef.current.innerHTML = '';
      
      // Generate unique ID
      const id = `mermaid-${Date.now()}`;
      
      // Render the diagram
      const { svg } = await mermaid.render(id, flowchartContent);
      mermaidRef.current.innerHTML = svg;
      
      // Apply zoom
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${zoom})`;
        svgElement.style.transformOrigin = 'top left';
      }
      
    } catch (error) {
      console.error('Failed to render Mermaid diagram:', error);
      mermaidRef.current.innerHTML = `
        <div class="p-4 text-red-500 bg-red-50 rounded">
          <strong>Error rendering diagram:</strong><br />
          ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
    } finally {
      setIsRendering(false);
    }
  }, [flowchartContent, zoom]);

  // Re-render diagram when content or zoom changes
  useEffect(() => {
    if (showDiagram) {
      renderMermaidDiagram();
    }
  }, [showDiagram, renderMermaidDiagram]);

  const handleGenerate = () => {
    if (!flowchartContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some Mermaid flowchart content.',
        variant: 'destructive',
      });
      return;
    }
    setShowDiagram(true);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFlowchartContent(content);
        setShowDiagram(true);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([flowchartContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = currentProject ? `${currentProject.name}-flowchart.mmd` : 'flowchart.mmd';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mermaid Input Panel - Left Column with adjustable width */}
      <div className="w-96 border-r bg-card flex flex-col resize-x overflow-auto min-w-[300px] max-w-[600px]">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentProject && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  {currentProject.name}
                </Badge>
                <div className="flex items-center gap-2">
                  {autoSave.isSaving && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </div>
                  )}
                  {autoSave.hasUnsavedChanges && !autoSave.isSaving && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <div className="w-2 h-2 bg-orange-600 rounded-full" />
                      Unsaved
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Flowchart Viewer</h1>
              <p className="text-sm text-muted-foreground">
                Mermaid Flowchart Visualizer
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Mermaid Input</h2>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept=".mmd,.txt"
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs"
              >
                <Upload className="h-3 w-3" />
                Upload
              </Button>
              
              {currentProject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveProjectFlowchart}
                  disabled={!flowchartContent.trim() || autoSave.isSaving}
                  className="flex items-center gap-1 text-xs"
                >
                  {autoSave.isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <Textarea
            placeholder="Enter your Mermaid flowchart syntax here..."
            value={flowchartContent}
            onChange={(e) => setFlowchartContent(e.target.value)}
            className="flex-1 font-mono text-sm resize-none"
          />
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p className="mb-1">Supported Mermaid syntax:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Flowcharts: flowchart TD, LR, TB, RL</li>
              <li>Nodes: A[Rectangle] B(Rounded) C{'{Diamond}'}</li>
              <li>Connections: A {'--> B, A --- B, A -.-> B'}</li>
              <li>Labels: A {'-->|Label| B'}</li>
            </ul>
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <strong>Example:</strong>
              <pre className="mt-1">{`flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Main Diagram Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Flowchart Viewer</h1>
              <p className="text-muted-foreground">
                Visualize your flowchart by entering Mermaid syntax in the left panel
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!flowchartContent.trim() || isRendering}
                className="flex items-center gap-2"
              >
                <GitBranch className="h-4 w-4" />
                {isRendering ? 'Rendering...' : 'Generate Diagram'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowDiagram(false)}
                disabled={!showDiagram}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {showDiagram && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="flex items-center gap-2"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-mono px-2">{Math.round(zoom * 100)}%</span>
                  <Button
                    variant="outline"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2}
                    className="flex items-center gap-2"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetZoom}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Zoom
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!flowchartContent.trim()}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="flex-1 relative">
            {showDiagram ? (
              <div className="h-full bg-white overflow-auto p-4">
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Rendering diagram...</span>
                    </div>
                  </div>
                )}
                <div 
                  ref={mermaidRef} 
                  className="mermaid-diagram min-h-full flex items-center justify-center" 
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/10">
                <div className="text-center">
                  <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No diagram generated yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter Mermaid syntax in the left panel and click "Generate Diagram"
                  </p>
                  <Button onClick={handleGenerate} disabled={!flowchartContent.trim()}>
                    Generate Diagram
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}