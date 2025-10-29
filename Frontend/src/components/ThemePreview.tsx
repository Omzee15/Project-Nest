import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Check } from 'lucide-react';

interface Theme {
  name: string;
  key: string;
  type: 'light' | 'dark';
}

interface ThemePreviewProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: (themeKey: string) => void;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, isSelected, onSelect }) => {
  const isDark = theme.type === 'dark';
  
  return (
    <div className="relative group">
      <Card 
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onSelect(theme.key)}
      >
        {/* Theme Preview */}
        <div className={`mb-3 rounded-lg border p-3 ${
          isDark 
            ? 'bg-slate-900 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          {/* Mock UI Elements */}
          <div className="space-y-2">
            {/* Header */}
            <div className={`h-2 w-3/4 rounded ${
              isDark ? 'bg-slate-300' : 'bg-slate-600'
            }`} />
            
            {/* Content area */}
            <div className="space-y-1">
              <div className={`h-1 w-full rounded ${
                isDark ? 'bg-slate-600' : 'bg-slate-300'
              }`} />
              <div className={`h-1 w-2/3 rounded ${
                isDark ? 'bg-slate-600' : 'bg-slate-300'
              }`} />
            </div>
            
            {/* Button */}
            <div className={`h-2 w-16 rounded ${
              isDark ? 'bg-blue-400' : 'bg-blue-600'
            }`} />
          </div>
        </div>
        
        {/* Theme Info */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{theme.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isDark ? 'secondary' : 'outline'} className="text-xs">
                {theme.type}
              </Badge>
            </div>
          </div>
          
          {isSelected && (
            <div className="text-primary">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};