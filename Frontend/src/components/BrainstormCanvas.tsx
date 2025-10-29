import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Save, 
  Download, 
  Upload, 
  Square, 
  Circle, 
  Type, 
  MousePointer,
  Trash2,
  Move,
  Minus,
  Pen,
  Eraser,
  Palette,
  RotateCw,
  Copy,
  Scissors,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface CanvasNode {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'freehand';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
  selected?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  rotation?: number;
  points?: { x: number; y: number }[];
  endX?: number;
  endY?: number;
}

type DrawingTool = 'select' | 'rectangle' | 'circle' | 'text' | 'line' | 'freehand' | 'eraser';

interface CanvasState {
  nodes: CanvasNode[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

interface BrainstormCanvasProps {
  projectUid: string;
  initialState?: CanvasState;
  onSave?: (state: CanvasState) => void;
  readOnly?: boolean;
  useExternalToolbar?: boolean;
  onToolbarProps?: (props: any) => void;
}

export const BrainstormCanvas: React.FC<BrainstormCanvasProps> = ({
  projectUid,
  initialState,
  onSave,
  readOnly = false,
  useExternalToolbar = false,
  onToolbarProps
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>(
    initialState || {
      nodes: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
  );
  // Enhanced state for drawing tools
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('select');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // Which resize handle
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  const [textEditPosition, setTextEditPosition] = useState({ x: 0, y: 0 });
  const [clipboard, setClipboard] = useState<CanvasNode[]>([]);

  // Tool settings
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Canvas update helper
  const updateCanvasState = (newState: CanvasState) => {
    setCanvasState(newState);
    setUnsavedChanges(true);
  };

  // Update external toolbar props
  useEffect(() => {
    if (useExternalToolbar && onToolbarProps) {
      onToolbarProps({
        selectedTool,
        onToolChange: setSelectedTool,
        unsavedChanges,
        onSave: handleSave,
        fillColor,
        onFillColorChange: setFillColor,
        strokeColor,
        onStrokeColorChange: setStrokeColor,
        strokeWidth,
        onStrokeWidthChange: setStrokeWidth,
        fontFamily,
        onFontFamilyChange: setFontFamily,
        fontSize,
        onFontSizeChange: setFontSize,
        isBold,
        onBoldChange: setIsBold,
        isItalic,
        onItalicChange: setIsItalic,
        isUnderline,
        onUnderlineChange: setIsUnderline,
        selectedNode,
        onDeleteSelected: deleteSelectedNode,
        onExportCanvas: exportCanvas,
        onImportCanvas: importCanvas
      });
    }
  }, [useExternalToolbar, readOnly, unsavedChanges, selectedTool, fillColor, strokeColor, strokeWidth, fontFamily, fontSize, isBold, isItalic, isUnderline, selectedNode]);

  // Canvas drawing utilities

  // Enhanced drawing functions
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transformation
    ctx.save();
    ctx.scale(canvasState.viewport.zoom, canvasState.viewport.zoom);
    ctx.translate(canvasState.viewport.x, canvasState.viewport.y);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw nodes
    canvasState.nodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw current path for freehand drawing
    if (currentPath.length > 0 && selectedTool === 'freehand') {
      drawPath(ctx, currentPath, strokeColor, strokeWidth);
    }

    ctx.restore();
  }, [canvasState, currentPath, selectedTool, strokeColor, strokeWidth]);

  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const gridSize = 20;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    
    for (let x = -canvasState.viewport.x % gridSize; x < canvas.width / canvasState.viewport.zoom; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -canvasState.viewport.y);
      ctx.lineTo(x, canvas.height / canvasState.viewport.zoom - canvasState.viewport.y);
      ctx.stroke();
    }
    for (let y = -canvasState.viewport.y % gridSize; y < canvas.height / canvasState.viewport.zoom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-canvasState.viewport.x, y);
      ctx.lineTo(canvas.width / canvasState.viewport.zoom - canvasState.viewport.x, y);
      ctx.stroke();
    }
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: CanvasNode) => {
    ctx.save();

    // Apply rotation if exists
    if (node.rotation) {
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((node.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Set styles
    ctx.fillStyle = node.color || fillColor;
    ctx.strokeStyle = node.strokeColor || strokeColor;
    ctx.lineWidth = node.strokeWidth || strokeWidth;

    if (node.selected) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }

    switch (node.type) {
      case 'rectangle':
        ctx.fillRect(node.x, node.y, node.width, node.height);
        ctx.strokeRect(node.x, node.y, node.width, node.height);
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(node.x + node.width / 2, node.y + node.height / 2, Math.min(node.width, node.height) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.endX || node.x + node.width, node.endY || node.y + node.height);
        ctx.stroke();
        break;
        
      case 'freehand':
        if (node.points && node.points.length > 0) {
          drawPath(ctx, node.points, node.strokeColor || strokeColor, node.strokeWidth || strokeWidth);
        }
        break;
        
      case 'text':
        ctx.fillStyle = node.strokeColor || '#000000';
        ctx.font = `${node.italic ? 'italic ' : ''}${node.bold ? 'bold ' : ''}${node.fontSize || fontSize}px ${node.fontFamily || fontFamily}`;
        ctx.textAlign = node.textAlign || 'left';
        
        const text = node.content || 'Text';
        const lines = text.split('\n');
        const lineHeight = (node.fontSize || fontSize) * 1.2;
        
        lines.forEach((line, index) => {
          let x = node.x;
          if (node.textAlign === 'center') x += node.width / 2;
          else if (node.textAlign === 'right') x += node.width;
          
          ctx.fillText(line, x, node.y + (index + 1) * lineHeight);
          
          if (node.underline) {
            const textWidth = ctx.measureText(line).width;
            let underlineX = node.x;
            if (node.textAlign === 'center') underlineX += (node.width - textWidth) / 2;
            else if (node.textAlign === 'right') underlineX += node.width - textWidth;
            
            ctx.beginPath();
            ctx.moveTo(underlineX, node.y + (index + 1) * lineHeight + 2);
            ctx.lineTo(underlineX + textWidth, node.y + (index + 1) * lineHeight + 2);
            ctx.stroke();
          }
        });
        break;
    }

    // Draw selection handles
    if (node.selected && selectedTool === 'select') {
      drawSelectionHandles(ctx, node);
    }

    ctx.restore();
  };

  const drawPath = (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[], color: string, width: number) => {
    if (points.length < 2) return;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
  };

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, node: CanvasNode) => {
    const handleSize = 6;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Corner handles
    const handles = [
      { x: node.x - handleSize/2, y: node.y - handleSize/2 }, // top-left
      { x: node.x + node.width - handleSize/2, y: node.y - handleSize/2 }, // top-right
      { x: node.x - handleSize/2, y: node.y + node.height - handleSize/2 }, // bottom-left
      { x: node.x + node.width - handleSize/2, y: node.y + node.height - handleSize/2 }, // bottom-right
    ];

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Handle canvas interactions
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / canvasState.viewport.zoom - canvasState.viewport.x,
      y: (e.clientY - rect.top) / canvasState.viewport.zoom - canvasState.viewport.y
    };
  };





  // Enhanced mouse handlers for MS Paint-like functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || readOnly) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.zoom;
    const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.zoom;

    setStartPos({ x, y });
    setIsDrawing(true);

    if (selectedTool === 'select') {
      // Selection logic
      const clickedNode = canvasState.nodes.find(node =>
        x >= node.x && x <= node.x + node.width &&
        y >= node.y && y <= node.y + node.height
      );

      if (clickedNode) {
        updateCanvasState({
          ...canvasState,
          nodes: canvasState.nodes.map(node => ({
            ...node,
            selected: node.id === clickedNode.id
          }))
        });
        setSelectedNode(clickedNode.id);
        setIsDragging(true);
      } else {
        updateCanvasState({
          ...canvasState,
          nodes: canvasState.nodes.map(node => ({ ...node, selected: false }))
        });
        setSelectedNode(null);
      }
    } else if (selectedTool === 'freehand') {
      setCurrentPath([{ x, y }]);
    } else if (selectedTool === 'eraser') {
      const nodeToErase = canvasState.nodes.find(node =>
        x >= node.x && x <= node.x + node.width &&
        y >= node.y && y <= node.y + node.height
      );

      if (nodeToErase) {
        updateCanvasState({
          ...canvasState,
          nodes: canvasState.nodes.filter(node => node.id !== nodeToErase.id)
        });
      }
    } else {
      const drawingTools: Array<CanvasNode['type']> = ['rectangle', 'circle', 'text', 'line'];
      
      if (drawingTools.includes(selectedTool as CanvasNode['type'])) {
        const newNode: CanvasNode = {
          id: Date.now().toString(),
          type: selectedTool as CanvasNode['type'],
          x,
          y,
          width: selectedTool === 'text' ? 100 : 0,
          height: selectedTool === 'text' ? 30 : 0,
          content: selectedTool === 'text' ? 'Text' : undefined,
          color: fillColor,
          strokeColor: strokeColor,
          strokeWidth: strokeWidth,
          fontSize: selectedTool === 'text' ? fontSize : undefined,
          fontFamily: selectedTool === 'text' ? fontFamily : undefined,
          bold: selectedTool === 'text' ? isBold : undefined,
          italic: selectedTool === 'text' ? isItalic : undefined,
          underline: selectedTool === 'text' ? isUnderline : undefined,
        };

        updateCanvasState({
          ...canvasState,
          nodes: [...canvasState.nodes, newNode]
        });
        setSelectedNode(newNode.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || readOnly) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.zoom;
    const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.zoom;

    if (isDrawing && startPos) {
      if (selectedTool === 'freehand') {
        setCurrentPath(prev => [...prev, { x, y }]);
      } else if (selectedTool !== 'select' && selectedTool !== 'eraser' && selectedNode) {
        const width = x - startPos.x;
        const height = y - startPos.y;

        updateCanvasState({
          ...canvasState,
          nodes: canvasState.nodes.map(node =>
            node.id === selectedNode
              ? { ...node, width: Math.abs(width), height: Math.abs(height), 
                  x: width < 0 ? x : startPos.x, y: height < 0 ? y : startPos.y,
                  endX: selectedTool === 'line' ? x : undefined,
                  endY: selectedTool === 'line' ? y : undefined }
              : node
          )
        });
      }
    }

    if (isDragging && selectedNode && selectedTool === 'select') {
      updateCanvasState({
        ...canvasState,
        nodes: canvasState.nodes.map(node =>
          node.id === selectedNode
            ? { ...node, x, y }
            : node
        )
      });
    }
  };

  const handleMouseUp = () => {
    if (selectedTool === 'freehand' && currentPath.length > 0) {
      const newNode: CanvasNode = {
        id: Date.now().toString(),
        type: 'freehand',
        x: Math.min(...currentPath.map(p => p.x)),
        y: Math.min(...currentPath.map(p => p.y)),
        width: Math.max(...currentPath.map(p => p.x)) - Math.min(...currentPath.map(p => p.x)),
        height: Math.max(...currentPath.map(p => p.y)) - Math.min(...currentPath.map(p => p.y)),
        points: currentPath,
        strokeColor: strokeColor,
        strokeWidth: strokeWidth,
      };

      updateCanvasState({
        ...canvasState,
        nodes: [...canvasState.nodes, newNode]
      });
      setCurrentPath([]);
    }

    setIsDrawing(false);
    setIsDragging(false);
    setStartPos(null);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode || readOnly) return;

    updateCanvasState({
      ...canvasState,
      nodes: canvasState.nodes.filter(node => node.id !== selectedNode)
    });
    setSelectedNode(null);
  };



  const clearCanvas = () => {
    if (readOnly) return;

    setCanvasState(prev => ({
      ...prev,
      nodes: []
    }));
    setSelectedNode(null);
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(canvasState);
      setUnsavedChanges(false);
    }
  };

  const exportCanvas = () => {
    const dataStr = JSON.stringify(canvasState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `canvas-${projectUid}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || readOnly) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedState = JSON.parse(e.target?.result as string) as CanvasState;
        updateCanvasState(importedState);
      } catch (error) {
        console.error('Error importing canvas:', error);
        alert('Failed to import canvas file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    drawCanvas();
  }, [drawCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;

      // Only trigger shortcuts when not typing in an input
      if (e.target && (e.target as HTMLElement).tagName !== 'INPUT') {
        switch (e.key.toLowerCase()) {
          case 'v':
            setSelectedTool('select');
            break;
          case 'r':
            setSelectedTool('rectangle');
            break;
          case 'c':
            setSelectedTool('circle');
            break;
          case 'l':
            setSelectedTool('line');
            break;
          case 'f':
            setSelectedTool('freehand');
            break;
          case 't':
            setSelectedTool('text');
            break;
          case 'e':
            setSelectedTool('eraser');
            break;
          case 'delete':
          case 'backspace':
            if (selectedNode) {
              deleteSelectedNode();
            }
            break;
          case 'escape':
            setSelectedNode(null);
            updateCanvasState({
              ...canvasState,
              nodes: canvasState.nodes.map(node => ({ ...node, selected: false }))
            });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, selectedNode, canvasState, updateCanvasState, deleteSelectedNode]);

  // Redraw when state changes
  useEffect(() => {
    drawCanvas();
  }, [canvasState, drawCanvas]);

  // Render external toolbar component
  const renderExternalToolbar = () => {
    if (!useExternalToolbar || readOnly) return null;

    const toolbarElement = (
      <div className="space-y-6">
        {/* Save Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Canvas Tools</h3>
          <div className="flex items-center gap-2">
            {unsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved
              </Badge>
            )}
            <Button onClick={handleSave} size="sm" variant="outline">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">DRAWING TOOLS</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={selectedTool === 'select' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('select')}
              className="justify-start"
            >
              <MousePointer className="w-4 h-4 mr-2" />
              Select
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('rectangle')}
              className="justify-start"
            >
              <Square className="w-4 h-4 mr-2" />
              Rectangle
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'circle' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('circle')}
              className="justify-start"
            >
              <Circle className="w-4 h-4 mr-2" />
              Circle
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'line' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('line')}
              className="justify-start"
            >
              <Minus className="w-4 h-4 mr-2" />
              Line
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'freehand' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('freehand')}
              className="justify-start"
            >
              <Pen className="w-4 h-4 mr-2" />
              Freehand
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'text' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('text')}
              className="justify-start"
            >
              <Type className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'eraser' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('eraser')}
              className="justify-start"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Eraser
            </Button>
          </div>
        </div>

        {/* Color and Style Controls */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">COLORS & STYLE</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Fill Color</label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-10 h-8 border rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Stroke Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-10 h-8 border rounded cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Stroke Width: {strokeWidth}px</label>
              <Input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Text Controls */}
        {selectedTool === 'text' && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">TEXT SETTINGS</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full text-sm px-2 py-1 border rounded bg-white mt-1"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Font Size</label>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsBold(!isBold)}
                  size="sm"
                  variant={isBold ? 'default' : 'outline'}
                  className="px-3 font-bold"
                >
                  B
                </Button>
                <Button
                  onClick={() => setIsItalic(!isItalic)}
                  size="sm"
                  variant={isItalic ? 'default' : 'outline'}
                  className="px-3 italic"
                >
                  I
                </Button>
                <Button
                  onClick={() => setIsUnderline(!isUnderline)}
                  size="sm"
                  variant={isUnderline ? 'default' : 'outline'}
                  className="px-3 underline"
                >
                  U
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">ACTIONS</h4>
          <div className="space-y-2">
            {selectedNode && (
              <Button size="sm" variant="outline" onClick={deleteSelectedNode} className="w-full justify-start">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={exportCanvas} className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export Canvas
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importCanvas}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Import Canvas
              </Button>
            </div>
          </div>
        </div>
      </div>
    );

    return toolbarElement;
  };

  if (useExternalToolbar) {
    return (
      <div className="relative w-full h-full border rounded-lg overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        {isEditingText && (
          <input
            ref={textInputRef}
            type="text"
            className="absolute bg-transparent border-none outline-none text-black"
            style={{
              left: textEditPosition.x,
              top: textEditPosition.y,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              color: fillColor,
            }}
            onBlur={() => setIsEditingText(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingText(false);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Canvas</CardTitle>
          <div className="flex items-center gap-2">
            {unsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
            {!readOnly && (
              <Button onClick={handleSave} size="sm" variant="outline">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
        
        {!readOnly && (
          <div className="flex items-center gap-2 pt-2">
            {/* Drawing Tools */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                size="sm"
                variant={selectedTool === 'select' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('select')}
                title="Select (V)"
              >
                <MousePointer className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={selectedTool === 'rectangle' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('rectangle')}
                title="Rectangle (R)"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={selectedTool === 'circle' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('circle')}
                title="Circle (C)"
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={selectedTool === 'line' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('line')}
                title="Line (L)"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={selectedTool === 'freehand' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('freehand')}
                title="Freehand (F)"
              >
                <Pen className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={selectedTool === 'text' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('text')}
                title="Text (T)"
              >
                <Type className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={selectedTool === 'eraser' ? 'default' : 'ghost'}
                onClick={() => setSelectedTool('eraser')}
                title="Eraser (E)"
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </div>

            {/* Color and Style Controls */}
            <div className="flex items-center gap-2 border rounded-md p-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Fill</label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-8 h-6 border rounded cursor-pointer"
                  title="Fill Color"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Stroke</label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-8 h-6 border rounded cursor-pointer"
                  title="Stroke Color"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Width</label>
                <Input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-16 h-6"
                  title="Stroke Width"
                />
              </div>
            </div>

            {/* Text Controls (when text tool is selected) */}
            {selectedTool === 'text' && (
              <div className="flex items-center gap-2 border rounded-md p-2">
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="text-xs px-2 py-1 border rounded bg-white"
                  title="Font Family"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-16 h-8"
                  title="Font Size"
                />
                <div className="flex gap-1">
                  <Button
                    onClick={() => setIsBold(!isBold)}
                    size="sm"
                    variant={isBold ? 'default' : 'ghost'}
                    className="px-2 font-bold"
                    title="Bold"
                  >
                    B
                  </Button>
                  <Button
                    onClick={() => setIsItalic(!isItalic)}
                    size="sm"
                    variant={isItalic ? 'default' : 'ghost'}
                    className="px-2 italic"
                    title="Italic"
                  >
                    I
                  </Button>
                  <Button
                    onClick={() => setIsUnderline(!isUnderline)}
                    size="sm"
                    variant={isUnderline ? 'default' : 'ghost'}
                    className="px-2 underline"
                    title="Underline"
                  >
                    U
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              {selectedNode && (
                <Button size="sm" variant="outline" onClick={deleteSelectedNode}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              
              <Button size="sm" variant="outline" onClick={exportCanvas}>
                <Download className="w-4 h-4" />
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importCanvas}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative h-96 border rounded-b-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}

          />
        </div>
      </CardContent>
    </Card>
  );
};