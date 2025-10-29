import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  GitCompare, 
  FileText, 
  Plus, 
  Minus, 
  Equal,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiffWord {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  words?: DiffWord[];
  lineNumber: number;
}

interface DiffResult {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
  additions: number;
  deletions: number;
  unchanged: number;
}

const DiffChecker: React.FC = () => {
  const { toast } = useToast();
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  
  // Style for the container to take full height
  const containerStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
  };

  // Simple diff algorithm implementation with word-level comparison
  const computeDiff = useMemo((): DiffResult => {
    const leftLines = leftText.split('\n');
    const rightLines = rightText.split('\n');
    
    const result: DiffResult = {
      leftLines: [],
      rightLines: [],
      additions: 0,
      deletions: 0,
      unchanged: 0
    };

    // Helper function to compute word-level diff for a line
    const computeWordDiff = (leftLine: string, rightLine: string): { leftWords: DiffWord[], rightWords: DiffWord[] } => {
      const leftWords = leftLine.split(/(\s+)/).filter(w => w.length > 0);
      const rightWords = rightLine.split(/(\s+)/).filter(w => w.length > 0);
      
      const leftResult: DiffWord[] = [];
      const rightResult: DiffWord[] = [];
      
      let leftIndex = 0;
      let rightIndex = 0;
      
      while (leftIndex < leftWords.length || rightIndex < rightWords.length) {
        const leftWord = leftWords[leftIndex];
        const rightWord = rightWords[rightIndex];
        
        if (leftWord === rightWord) {
          // Words match
          leftResult.push({ text: leftWord, type: 'unchanged' });
          rightResult.push({ text: rightWord, type: 'unchanged' });
          leftIndex++;
          rightIndex++;
        } else {
          // Find if the left word appears later in right words
          const leftWordInRight = rightWords.slice(rightIndex).indexOf(leftWord);
          // Find if the right word appears later in left words
          const rightWordInLeft = leftWords.slice(leftIndex).indexOf(rightWord);
          
          if (leftWordInRight !== -1 && (rightWordInLeft === -1 || leftWordInRight <= rightWordInLeft)) {
            // Left word appears later in right, so words before it in right are additions
            for (let i = 0; i < leftWordInRight; i++) {
              rightResult.push({ text: rightWords[rightIndex + i], type: 'added' });
            }
            rightIndex += leftWordInRight;
          } else if (rightWordInLeft !== -1) {
            // Right word appears later in left, so words before it in left are deletions
            for (let i = 0; i < rightWordInLeft; i++) {
              leftResult.push({ text: leftWords[leftIndex + i], type: 'removed' });
            }
            leftIndex += rightWordInLeft;
          } else {
            // Words don't match and don't appear later
            if (leftWord) {
              leftResult.push({ text: leftWord, type: 'removed' });
              leftIndex++;
            }
            if (rightWord) {
              rightResult.push({ text: rightWord, type: 'added' });
              rightIndex++;
            }
          }
        }
      }
      
      return { leftWords: leftResult, rightWords: rightResult };
    };

    // Simple line-by-line comparison with word-level diff for modified lines
    const maxLength = Math.max(leftLines.length, rightLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      const leftLine = leftLines[i] || '';
      const rightLine = rightLines[i] || '';
      
      if (leftLine === rightLine) {
        // Lines are the same
        result.leftLines.push({
          type: 'unchanged',
          content: leftLine,
          lineNumber: i + 1
        });
        result.rightLines.push({
          type: 'unchanged',
          content: rightLine,
          lineNumber: i + 1
        });
        result.unchanged++;
      } else {
        // Lines are different
        if (leftLine && !rightLine) {
          // Line removed from right
          result.leftLines.push({
            type: 'removed',
            content: leftLine,
            lineNumber: i + 1
          });
          result.rightLines.push({
            type: 'removed',
            content: '',
            lineNumber: i + 1
          });
          result.deletions++;
        } else if (!leftLine && rightLine) {
          // Line added to right
          result.leftLines.push({
            type: 'added',
            content: '',
            lineNumber: i + 1
          });
          result.rightLines.push({
            type: 'added',
            content: rightLine,
            lineNumber: i + 1
          });
          result.additions++;
        } else {
          // Line modified - compute word-level diff
          const wordDiff = computeWordDiff(leftLine, rightLine);
          
          result.leftLines.push({
            type: 'removed',
            content: leftLine,
            words: wordDiff.leftWords,
            lineNumber: i + 1
          });
          result.rightLines.push({
            type: 'added',
            content: rightLine,
            words: wordDiff.rightWords,
            lineNumber: i + 1
          });
          result.deletions++;
          result.additions++;
        }
      }
    }
    
    return result;
  }, [leftText, rightText]);

  const handleClear = () => {
    setLeftText('');
    setRightText('');
  };

  const handleCopyDiff = () => {
    const diffText = computeDiff.leftLines.map((leftLine, index) => {
      const rightLine = computeDiff.rightLines[index];
      
      if (leftLine.type === 'unchanged') {
        return `  ${leftLine.content}`;
      } else if (leftLine.type === 'removed') {
        return `- ${leftLine.content}`;
      } else if (rightLine.type === 'added') {
        return `+ ${rightLine.content}`;
      }
      
      return '';
    }).join('\n');

    navigator.clipboard.writeText(diffText).then(() => {
      toast({
        title: 'Copied to clipboard',
        description: 'Diff output has been copied to your clipboard.',
      });
    });
  };

  const getLineClassName = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-white border-l-4 border-gray-200';
    }
  };

  const renderWordDiff = (words: DiffWord[]) => {
    return words.map((word, index) => {
      let className = '';
      switch (word.type) {
        case 'added':
          className = 'bg-green-200 text-green-800 px-1 rounded';
          break;
        case 'removed':
          className = 'bg-red-200 text-red-800 px-1 rounded';
          break;
        default:
          className = '';
      }
      
      return (
        <span key={index} className={className}>
          {word.text}
        </span>
      );
    });
  };

  const getLineIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="w-3 h-3 text-green-600" />;
      case 'removed':
        return <Minus className="w-3 h-3 text-red-600" />;
      default:
        return <Equal className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between py-1.5 px-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500">
            <GitCompare className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Text Difference Checker</h2>
            <p className="text-xs text-gray-600 leading-tight">Compare two texts side by side</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyDiff}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Diff
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="flex-shrink-0 flex items-center gap-4 p-2 bg-gray-50 border-b">
        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
          <Plus className="w-3 h-3 mr-1" />
          {computeDiff.additions} additions
        </Badge>
        <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
          <Minus className="w-3 h-3 mr-1" />
          {computeDiff.deletions} deletions
        </Badge>
        <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50">
          <Equal className="w-3 h-3 mr-1" />
          {computeDiff.unchanged} unchanged
        </Badge>
      </div>

      {/* Input Areas */}
      <div className="flex-shrink-0 p-2 bg-white border-b">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Original Text
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Textarea
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                placeholder="Paste your original text here..."
                className="h-32 font-mono text-sm resize-none"
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Modified Text
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Textarea
                value={rightText}
                onChange={(e) => setRightText(e.target.value)}
                placeholder="Paste your modified text here..."
                className="h-32 font-mono text-sm resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diff Results */}
      {(leftText || rightText) && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-2 bg-white border-b">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Difference Comparison
            </h3>
          </div>
          
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            {/* Left side diff */}
            <div className="flex flex-col border-r">
              <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-sm font-medium text-gray-700">Original Text</h4>
              </div>
              <div className="flex-1 overflow-y-auto">
                {computeDiff.leftLines.map((line, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 text-sm font-mono flex items-start gap-3 min-h-[2rem] ${getLineClassName(line.type)}`}
                  >
                    <span className="text-xs text-gray-500 w-8 flex-shrink-0 mt-1">
                      {line.content ? line.lineNumber : ''}
                    </span>
                    {getLineIcon(line.type)}
                    <span className="flex-1 whitespace-pre-wrap break-all">
                      {line.words ? renderWordDiff(line.words) : (line.content || '\u00A0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side diff */}
            <div className="flex flex-col">
              <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-sm font-medium text-gray-700">Modified Text</h4>
              </div>
              <div className="flex-1 overflow-y-auto">
                {computeDiff.rightLines.map((line, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 text-sm font-mono flex items-start gap-3 min-h-[2rem] ${getLineClassName(line.type)}`}
                  >
                    <span className="text-xs text-gray-500 w-8 flex-shrink-0 mt-1">
                      {line.content ? line.lineNumber : ''}
                    </span>
                    {getLineIcon(line.type)}
                    <span className="flex-1 whitespace-pre-wrap break-all">
                      {line.words ? renderWordDiff(line.words) : (line.content || '\u00A0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!leftText && !rightText && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <GitCompare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No text to compare</p>
            <p className="text-sm">Add text to both fields above to see the differences</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffChecker;