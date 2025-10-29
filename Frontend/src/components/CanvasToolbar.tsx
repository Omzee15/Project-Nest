import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  Download, 
  Upload, 
  Square, 
  Circle, 
  Type, 
  MousePointer,
  Trash2,
  Minus,
  Pen,
  Eraser
} from 'lucide-react';

type DrawingTool = 'select' | 'rectangle' | 'circle' | 'text' | 'line' | 'freehand' | 'eraser';

interface CanvasToolbarProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  unsavedChanges: boolean;
  onSave: () => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fontFamily: string;
  onFontFamilyChange: (family: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isBold: boolean;
  onBoldChange: (bold: boolean) => void;
  isItalic: boolean;
  onItalicChange: (italic: boolean) => void;
  isUnderline: boolean;
  onUnderlineChange: (underline: boolean) => void;
  selectedNode: string | null;
  onDeleteSelected: () => void;
  onExportCanvas: () => void;
  onImportCanvas: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  selectedTool,
  onToolChange,
  unsavedChanges,
  onSave,
  fillColor,
  onFillColorChange,
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  isBold,
  onBoldChange,
  isItalic,
  onItalicChange,
  isUnderline,
  onUnderlineChange,
  selectedNode,
  onDeleteSelected,
  onExportCanvas,
  onImportCanvas
}) => {
  return (
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
          <Button onClick={onSave} size="sm" variant="outline">
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
            onClick={() => onToolChange('select')}
            className="justify-start"
          >
            <MousePointer className="w-4 h-4 mr-2" />
            Select
          </Button>
          <Button
            size="sm"
            variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
            onClick={() => onToolChange('rectangle')}
            className="justify-start"
          >
            <Square className="w-4 h-4 mr-2" />
            Rectangle
          </Button>
          <Button
            size="sm"
            variant={selectedTool === 'circle' ? 'default' : 'outline'}
            onClick={() => onToolChange('circle')}
            className="justify-start"
          >
            <Circle className="w-4 h-4 mr-2" />
            Circle
          </Button>
          <Button
            size="sm"
            variant={selectedTool === 'line' ? 'default' : 'outline'}
            onClick={() => onToolChange('line')}
            className="justify-start"
          >
            <Minus className="w-4 h-4 mr-2" />
            Line
          </Button>
          <Button
            size="sm"
            variant={selectedTool === 'freehand' ? 'default' : 'outline'}
            onClick={() => onToolChange('freehand')}
            className="justify-start"
          >
            <Pen className="w-4 h-4 mr-2" />
            Freehand
          </Button>
          <Button
            size="sm"
            variant={selectedTool === 'text' ? 'default' : 'outline'}
            onClick={() => onToolChange('text')}
            className="justify-start"
          >
            <Type className="w-4 h-4 mr-2" />
            Text
          </Button>
          <Button
            size="sm"
            variant={selectedTool === 'eraser' ? 'default' : 'outline'}
            onClick={() => onToolChange('eraser')}
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
              onChange={(e) => onFillColorChange(e.target.value)}
              className="w-10 h-8 border rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Stroke Color</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => onStrokeColorChange(e.target.value)}
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
              onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
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
                onChange={(e) => onFontFamilyChange(e.target.value)}
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
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onBoldChange(!isBold)}
                size="sm"
                variant={isBold ? 'default' : 'outline'}
                className="px-3 font-bold"
              >
                B
              </Button>
              <Button
                onClick={() => onItalicChange(!isItalic)}
                size="sm"
                variant={isItalic ? 'default' : 'outline'}
                className="px-3 italic"
              >
                I
              </Button>
              <Button
                onClick={() => onUnderlineChange(!isUnderline)}
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
            <Button size="sm" variant="outline" onClick={onDeleteSelected} className="w-full justify-start">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onExportCanvas} className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Export Canvas
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={onImportCanvas}
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
};