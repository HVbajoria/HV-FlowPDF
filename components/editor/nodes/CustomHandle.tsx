import React from 'react';
import { Handle, HandleProps, Position } from 'reactflow';
import { cn } from '../../../lib/utils';

export const CustomHandle = ({ className, position, ...props }: HandleProps & { className?: string }) => {
  // Calculate exact position to center on edge
  const getPositionStyle = () => {
    const size = 16;
    const offset = -size / 2;
    
    switch (position) {
      case Position.Left:
        return { left: `${offset}px`, top: '50%', transform: 'translateY(-50%)' };
      case Position.Right:
        return { right: `${offset}px`, top: '50%', transform: 'translateY(-50%)' };
      case Position.Top:
        return { top: `${offset}px`, left: '50%', transform: 'translateX(-50%)' };
      case Position.Bottom:
        return { bottom: `${offset}px`, left: '50%', transform: 'translateX(-50%)' };
      default:
        return {};
    }
  };

  return (
    <Handle
      position={position}
      style={{
        ...getPositionStyle(),
        width: '16px',
        height: '16px',
        minWidth: '16px',
        minHeight: '16px',
        borderRadius: '50%',
        border: '2px solid hsl(var(--background))',
      }}
      className={cn(
        "bg-muted-foreground transition-colors duration-200 shadow-sm",
        "hover:bg-primary hover:border-primary",
        className
      )}
      {...props}
    />
  );
};