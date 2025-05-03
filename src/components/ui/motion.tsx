
import React from "react";
import { cn } from "@/lib/utils";

interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  children: React.ReactNode;
}

export const motion = {
  div: ({ 
    className, 
    initial, 
    animate, 
    exit, 
    transition, 
    children, 
    ...props 
  }: MotionProps) => {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
    
    // Apply animations via CSS classes and styles
    const getStyles = () => {
      if (!mounted) {
        return {
          opacity: initial?.opacity ?? 1,
          transform: `translateY(${initial?.y ?? 0}px) translateX(${initial?.x ?? 0}px) scale(${initial?.scale ?? 1})`,
        };
      }
      
      return {
        opacity: animate?.opacity ?? 1,
        transform: `translateY(${animate?.y ?? 0}px) translateX(${animate?.x ?? 0}px) scale(${animate?.scale ?? 1})`,
        transition: `all ${transition?.duration ?? 0.3}s ${transition?.ease ?? 'ease'} ${transition?.delay ?? 0}s`,
      };
    };
    
    return (
      <div 
        className={cn(className)}
        style={getStyles()}
        {...props}
      >
        {children}
      </div>
    );
  },
  
  // Add other element types as needed
  section: (props: MotionProps) => motion.div({...props}),
  article: (props: MotionProps) => motion.div({...props}),
  header: (props: MotionProps) => motion.div({...props}),
  footer: (props: MotionProps) => motion.div({...props}),
  main: (props: MotionProps) => motion.div({...props}),
  aside: (props: MotionProps) => motion.div({...props}),
  nav: (props: MotionProps) => motion.div({...props})
};
