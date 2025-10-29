import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Upload, 
  Database, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  FileText,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/use-auto-save';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  Handle,
  Position,
  getRectOfNodes,
  getTransformForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Parser } from '@dbml/core';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Custom Table Node Component
const TableNode = ({ data }: { data: any }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className="relative bg-card border border-border rounded-lg shadow-lg min-w-[250px] max-w-[350px]">
      {/* Connection Handles - Hidden but functional */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          left: '0px',
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          right: '0px',
          opacity: 0,
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          top: '0px',
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          bottom: '0px',
          opacity: 0,
        }}
      />
      
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t-lg font-semibold text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {data.name}
        </div>
        <Button
          variant="ghost"
          size="sm" 
          className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-3">
          <div className="space-y-1">
            {data.columns?.map((column: any, index: number) => (
              <div 
                key={index} 
                className={`flex items-center justify-between text-xs p-1 rounded transition-colors ${
                  column.isForeign ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-400' : 
                  column.isPrimary ? 'bg-red-50 dark:bg-red-950/30 border-l-2 border-red-400' : 
                  'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`font-medium truncate ${
                    column.isPrimary ? 'text-red-700 dark:text-red-300' :
                    column.isForeign ? 'text-blue-700 dark:text-blue-300' :
                    ''
                  }`}>
                    {column.name}
                  </span>
                  <Badge 
                    variant={column.isPrimary ? "destructive" : column.isForeign ? "default" : "secondary"} 
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {column.type}
                  </Badge>
                </div>
                <div className="flex gap-1 ml-2">
                  {column.isPrimary && (
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3 font-bold">
                      PK
                    </Badge>
                  )}
                  {column.isForeign && (
                    <Badge variant="default" className="text-[9px] px-1 py-0 h-3 font-bold">
                      FK
                    </Badge>
                  )}
                  {column.isUnique && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3">
                      U
                    </Badge>
                  )}
                  {column.notNull && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3">
                      NN
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

// DB Viewer Flow Component
const DBViewerFlow = ({ 
  dbmlContent, 
  layoutData,
  autoRender,
  onExportImage, 
  onExportJSON,
  onLayoutChange,
  fitViewRef
}: { 
  dbmlContent: string;
  layoutData?: string;
  autoRender?: boolean;
  onExportImage: () => void;
  onExportJSON: () => void;
  onLayoutChange: (layoutData: string) => void;
  fitViewRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoRendered, setHasAutoRendered] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { fitView, getViewport } = useReactFlow();

  // Layout management functions
  const saveCurrentLayout = useCallback(() => {
    console.log('Saving current layout, nodes count:', nodes.length);
    const viewport = getViewport();
    const layoutData = {
      nodes: nodes.map(node => ({
        id: node.id,
        position: node.position,
        width: node.width || 250,
        height: node.height || 'auto'
      })),
      viewport: {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom
      }
    };
    console.log('Layout data being saved:', layoutData);
    onLayoutChange(JSON.stringify(layoutData));
  }, [nodes, getViewport, onLayoutChange]);

  const restoreLayout = useCallback((layoutDataStr: string, newNodes: Node[]) => {
    console.log('Attempting to restore layout...');
    setIsRestoring(true);
    try {
      const layoutData = JSON.parse(layoutDataStr);
      console.log('Parsed layout data:', layoutData);
      
      // Restore node positions
      const restoredNodes = newNodes.map(node => {
        const savedNode = layoutData.nodes?.find((n: any) => n.id === node.id);
        if (savedNode) {
          console.log(`Restoring position for node ${node.id}:`, savedNode.position);
          return {
            ...node,
            position: savedNode.position,
            width: savedNode.width,
            height: savedNode.height
          };
        }
        console.log(`No saved position found for node ${node.id}, using default`);
        return node;
      });

      console.log('Setting restored nodes:', restoredNodes);
      setNodes(restoredNodes);

      // Restore viewport after a short delay to ensure nodes are rendered
      if (layoutData.viewport) {
        console.log('Restoring viewport:', layoutData.viewport);
        setTimeout(() => {
          fitView({
            duration: 0,
            ...layoutData.viewport
          });
        }, 100);
      }

      return restoredNodes;
    } catch (error) {
      console.error('Failed to restore layout:', error);
      return newNodes;
    } finally {
      // Clear the restoring flag after a delay to allow the layout to settle
      setTimeout(() => {
        setIsRestoring(false);
      }, 1000);
    }
  }, [setNodes, fitView]);

  // Advanced export function using ReactFlow utilities
  const exportAsImage = useCallback(async () => {
    if (nodes.length === 0) return false;

    try {
      console.log('Starting advanced export with ReactFlow utilities...');
      
      // Get the bounds of all nodes
      const nodesBounds = getRectOfNodes(nodes);
      console.log('Nodes bounds:', nodesBounds);
      
      // Calculate transform for optimal view
      const imageWidth = 1920;
      const imageHeight = 1080;
      const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 0.8, 2);
      console.log('Transform for bounds:', transform);
      
      // Apply the transform to fit all nodes
      const viewport = getViewport();
      console.log('Current viewport:', viewport);
      
      // This approach doesn't work directly, so let's fall back to the improved method
      return false;
    } catch (error) {
      console.error('Advanced export failed:', error);
      return false;
    }
  }, [nodes, getViewport]);

  // Provide fit view function to parent for export
  const handleFitViewForExport = useCallback(async () => {
    console.log('Fitting view for export with nodes:', nodes.length);
    if (nodes.length === 0) {
      console.log('No nodes to fit');
      return;
    }
    
    // Fit view with moderate padding - not too much to avoid over-zooming out
    fitView({ 
      padding: 0.15, // Reduced padding to prevent excessive zoom out
      duration: 600, // Moderate duration
      includeHiddenNodes: true,
      minZoom: 0.2, // Prevent excessive zoom out
      maxZoom: 1.2
    });
    
    // Wait for the animation to complete and stabilize
    await new Promise(resolve => setTimeout(resolve, 700));
    console.log('Fit view completed for export');
  }, [fitView, nodes]);

  // Expose the fit view function to parent
  useEffect(() => {
    if (fitViewRef) {
      fitViewRef.current = handleFitViewForExport;
    }
  }, [handleFitViewForExport, fitViewRef]);

  // Handle export image with fallback
  const handleExportImage = useCallback(async () => {
    const advancedExportSuccess = await exportAsImage();
    if (!advancedExportSuccess) {
      // Fall back to parent export method
      onExportImage();
    }
  }, [exportAsImage, onExportImage]);

  // Custom node change handler to save layout on position changes
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Don't save layout during restoration or initial load
    if (isRestoring) {
      console.log('Skipping layout save during restoration');
      return;
    }
    
    // Check if any position changes occurred
    const hasPositionChange = changes.some(change => 
      change.type === 'position' && change.dragging === false
    );
    
    if (hasPositionChange) {
      console.log('Position change detected, saving layout...');
      // Debounce the layout save to avoid too many API calls
      setTimeout(() => {
        saveCurrentLayout();
      }, 500);
    }
  }, [onNodesChange, saveCurrentLayout, isRestoring]);

  const parseDBML = useCallback(async () => {
    if (!dbmlContent.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse DBML content
      const parser = new Parser();
      const database = parser.parse(dbmlContent, 'dbml');
      
      // Collect foreign key information from refs
      const foreignKeys = new Set<string>();
      database.schemas[0]?.refs?.forEach((ref) => {
        const sourceEndpoint = ref.endpoints[0];
        if (sourceEndpoint?.tableName && sourceEndpoint?.fieldNames) {
          sourceEndpoint.fieldNames.forEach(fieldName => {
            foreignKeys.add(`${sourceEndpoint.tableName}.${fieldName}`);
          });
        }
      });

      // Create nodes for tables
      const tableNodes: Node[] = database.schemas[0]?.tables.map((table, index) => {
        const columns = table.fields.map(field => ({
          name: field.name,
          type: field.type.type_name,
          isPrimary: field.pk,
          isForeign: foreignKeys.has(`${table.name}.${field.name}`),
          isUnique: field.unique,
          notNull: field.not_null,
        }));

        return {
          id: table.name,
          type: 'table',
          position: { 
            x: (index % 4) * 450 + 100, 
            y: Math.floor(index / 4) * 500 + 100 
          },
          data: {
            name: table.name,
            columns: columns,
          },
          draggable: true,
        };
      }) || [];

      // Create edges for relationships
      const relationshipEdges: Edge[] = [];
      database.schemas[0]?.refs?.forEach((ref, index) => {
        const sourceTable = ref.endpoints[0]?.tableName;
        const targetTable = ref.endpoints[1]?.tableName;
        const sourceField = ref.endpoints[0]?.fieldNames?.[0];
        const targetField = ref.endpoints[1]?.fieldNames?.[0];
        
        if (sourceTable && targetTable) {
          relationshipEdges.push({
            id: `rel-${index}`,
            source: sourceTable,
            target: targetTable,
            type: 'smoothstep',
            animated: false,
            style: { 
              stroke: 'hsl(var(--primary))', 
              strokeWidth: 2,
              strokeDasharray: '0',
            },
            label: sourceField && targetField ? `${sourceField} → ${targetField}` : '',
            labelStyle: { 
              fontSize: '12px', 
              fontWeight: '500',
              fill: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--background))',
              padding: '2px 4px',
              borderRadius: '4px',
              border: '1px solid hsl(var(--border))'
            },
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: {
              fill: 'hsl(var(--background))',
              stroke: 'hsl(var(--border))',
              strokeWidth: 1,
              fillOpacity: 0.9,
            },
          });
        }
      });

      // Restore layout if available, otherwise use default positions
      console.log('Layout data available for restoration:', !!layoutData);
      if (layoutData && layoutData.trim()) {
        console.log('Calling restoreLayout with data:', layoutData);
        restoreLayout(layoutData, tableNodes);
      } else {
        console.log('No layout data available, using default positions');
        setNodes(tableNodes);
        // Fit view after a short delay to ensure nodes are rendered with proper padding
        setTimeout(() => fitView({ 
          padding: 0.15,
          duration: 800,
          includeHiddenNodes: true 
        }), 200);
      }
      
      setEdges(relationshipEdges);
      
    } catch (err) {
      console.error('Error parsing DBML:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse DBML content');
    } finally {
      setIsLoading(false);
    }
  }, [dbmlContent, fitView, setNodes, setEdges]);

  // Auto-render DBML when autoRender is true and content is available (only once)
  useEffect(() => {
    if (autoRender && dbmlContent.trim() && !isLoading && !hasAutoRendered) {
      console.log('Auto-rendering DBML content (first time only)');
      setHasAutoRendered(true);
      // Delay to ensure the flow is fully ready
      const timer = setTimeout(() => {
        parseDBML();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [autoRender, dbmlContent, isLoading, hasAutoRendered, parseDBML]);

  // Reset auto-render flag when content changes (new project loaded)
  useEffect(() => {
    setHasAutoRendered(false);
  }, [dbmlContent]);

  const handleFitView = () => {
    fitView({ padding: 0.1 });
  };

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setError(null);
    setHasAutoRendered(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            onClick={parseDBML}
            disabled={!dbmlContent.trim() || isLoading}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {isLoading ? 'Rendering...' : 'Render Diagram'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={nodes.length === 0}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleFitView}
            disabled={nodes.length === 0}
            className="flex items-center gap-2"
          >
            <ZoomIn className="h-4 w-4" />
            Fit View
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportImage}
            disabled={nodes.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Image
          </Button>
          
          <Button
            variant="outline"
            onClick={onExportJSON}
            disabled={nodes.length === 0}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="p-3">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-background"
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          
          <Panel position="bottom-right" className="bg-card border border-border rounded-lg p-2">
            <div className="text-xs text-muted-foreground">
              Tables: {nodes.length} | Relations: {edges.length}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Main DB Viewer Component
export default function DBViewer() {
  const [dbmlContent, setDbmlContent] = useState('');
  const [layoutData, setLayoutData] = useState<string>('');
  const [showDiagram, setShowDiagram] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  const fitViewRef = useRef<(() => Promise<void>) | null>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Load project if projectId is provided in URL params
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    console.log('useEffect triggered - projectId from URL:', projectId);
    console.log('searchParams:', searchParams.toString());
    if (projectId) {
      console.log('Loading project DBML for projectId:', projectId);
      loadProjectDbml(projectId);
    } else {
      console.log('No projectId found in URL parameters');
    }
  }, [searchParams]);

  const loadProjectDbml = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      const response = await apiService.getProject(projectId);
      const project = response.data;
      console.log('Loaded project:', project);
      console.log('Project DBML content:', project.dbml_content);
      setCurrentProject(project);
      
      if (project.dbml_content) {
        console.log('Setting DBML content:', project.dbml_content);
        setDbmlContent(project.dbml_content);
        
        // Load layout data if available
        console.log('Project dbml_layout_data field:', project.dbml_layout_data);
        if (project.dbml_layout_data) {
          console.log('Setting layout data:', project.dbml_layout_data);
          setLayoutData(project.dbml_layout_data);
        } else {
          console.log('No layout data found in project');
          setLayoutData('');
        }
        
        setShowDiagram(true);
      } else {
        console.log('No DBML content found in project');
      }
    } catch (error) {
      console.error('Failed to load project DBML:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project database schema.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProject(false);
    }
  };

  const saveProjectDbml = async () => {
    if (!currentProject) return;
    
    try {
      console.log('Saving DBML content:', dbmlContent);
      console.log('Project UID:', currentProject.project_uid);
      
      await apiService.partialUpdateProject(currentProject.project_uid, {
        dbml_content: dbmlContent
      });
      
      console.log('DBML content saved successfully');
      
      toast({
        title: 'Success',
        description: 'Database schema saved to project.',
      });
    } catch (error) {
      console.error('Failed to save project DBML:', error);
      toast({
        title: 'Error',
        description: 'Failed to save database schema.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Auto-save functionality for DBML content
  const autoSave = useAutoSave(
    dbmlContent,
    async (content: string) => {
      if (!currentProject) return;
      
      console.log('Auto-saving DBML content:', content);
      
      await apiService.partialUpdateProject(currentProject.project_uid, {
        dbml_content: content
      });
      
      console.log('Auto-save completed');
    },
    {
      delay: 3000, // 3 seconds after user stops typing
      enabled: !!currentProject,
      onSaveSuccess: () => {
        toast({
          title: 'Auto-saved',
          description: 'Database schema has been automatically saved.',
          duration: 2000,
        });
      },
      onSaveError: (error) => {
        toast({
          title: 'Auto-save failed',
          description: 'Failed to auto-save database schema. Please save manually.',
          variant: 'destructive',
          duration: 3000,
        });
      },
    }
  );

  // Layout change handler
  const handleLayoutChange = async (newLayoutData: string) => {
    if (!currentProject) return;
    
    try {
      setLayoutData(newLayoutData);
      
      console.log('Saving layout data:', newLayoutData);
      
      await apiService.partialUpdateProject(currentProject.project_uid, {
        dbml_layout_data: newLayoutData
      });
      
      console.log('Layout data saved successfully');
    } catch (error) {
      console.error('Failed to save layout data:', error);
      toast({
        title: 'Layout save failed',
        description: 'Failed to save diagram layout. Your layout changes may not be preserved.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDbmlContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleExportImage = async () => {
    console.log('Export image clicked');
    if (!flowRef.current) {
      console.error('flowRef.current is null');
      toast({
        title: 'Export Failed',
        description: 'Unable to find diagram area to export.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Show a toast to indicate we're preparing the export
      toast({
        title: 'Preparing Export',
        description: 'Fitting view to show all tables...',
      });
      
      // Fit the view to show all tables before capturing
      if (fitViewRef.current) {
        await fitViewRef.current();
      }
      
      // Additional wait to ensure everything is rendered and stabilized
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Starting html2canvas capture...');
      
      // Target the main ReactFlow container for the most accurate capture
      const reactFlowContainer = flowRef.current.querySelector('.react-flow');
      const targetElement = reactFlowContainer || flowRef.current;
      
      // Get the actual rendered bounds
      const rect = (targetElement as HTMLElement).getBoundingClientRect();
      
      console.log('Target element for capture:', targetElement);
      console.log('Element rect:', rect);
      console.log('Element dimensions:', {
        clientWidth: (targetElement as HTMLElement).clientWidth,
        clientHeight: (targetElement as HTMLElement).clientHeight,
        offsetWidth: (targetElement as HTMLElement).offsetWidth,
        offsetHeight: (targetElement as HTMLElement).offsetHeight
      });
      
      const canvas = await html2canvas(targetElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false, // Disable logging for cleaner output
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        // Use the actual visible dimensions
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        ignoreElements: (element) => {
          // Ignore controls and other UI elements
          return element.classList.contains('react-flow__controls') ||
                 element.classList.contains('react-flow__minimap') ||
                 element.classList.contains('react-flow__background');
        },
      });
      
      console.log('Canvas created:', canvas.width, 'x', canvas.height);
      
      // Ensure we have some content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has no content to export');
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Blob created, downloading...');
          const fileName = currentProject ? `${currentProject.name}-db-diagram.png` : 'db-diagram.png';
          saveAs(blob, fileName);
          toast({
            title: 'Export Successful',
            description: 'Database diagram exported as image.',
          });
        } else {
          console.error('Failed to create blob');
          toast({
            title: 'Export Failed',
            description: 'Failed to create image file.',
            variant: 'destructive',
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error exporting image:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export image.',
        variant: 'destructive',
      });
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      dbml: dbmlContent,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    saveAs(blob, 'db-schema.json');
  };



  return (
    <div className="flex h-screen bg-background">
      {/* DBML Input Panel - Left Column with adjustable width */}
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
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DB Viewer</h1>
              <p className="text-sm text-muted-foreground">
                Database Schema Visualizer
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">DBML Input</h2>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".dbml,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="flex items-center gap-1 text-xs"
              >
                <Upload className="h-3 w-3" />
                Upload
              </Button>
              
              {currentProject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveProjectDbml}
                  disabled={!dbmlContent.trim() || autoSave.isSaving}
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
            placeholder="Paste your DBML content here..."
            value={dbmlContent}
            onChange={(e) => setDbmlContent(e.target.value)}
            className="flex-1 font-mono text-sm resize-none"
          />
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p className="mb-1">Supported DBML syntax:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Table definitions with columns and constraints</li>
              <li>Primary keys: [primary key] or [pk]</li>
              <li>Foreign key relationships: Ref: table1.column {`>`} table2.column</li>
              <li>Data types, unique constraints, and notes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Diagram Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Database Viewer</h1>
              <p className="text-muted-foreground">
                Visualize your database schema by pasting DBML content in the left panel
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div ref={flowRef} className="h-full">
            <ReactFlowProvider>
              <DBViewerFlow
                dbmlContent={dbmlContent}
                layoutData={layoutData}
                autoRender={!!currentProject && showDiagram}
                onExportImage={handleExportImage}
                onExportJSON={handleExportJSON}
                onLayoutChange={handleLayoutChange}
                fitViewRef={fitViewRef}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
}