import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps extends React.ComponentProps<typeof Progress> {
  value: number;
  showPercentage?: boolean;
  animationDuration?: number;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  showPercentage = false,
  animationDuration = 1000,
  className,
  ...props
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Progress
          value={animatedValue}
          className={cn(
            "transition-all ease-out h-2",
            className
          )}
          style={{
            transitionDuration: `${animationDuration}ms`,
          }}
          {...props}
        />
        {showPercentage && (
          <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem] text-right">
            {Math.round(animatedValue)}%
          </span>
        )}
      </div>
    </div>
  );
};