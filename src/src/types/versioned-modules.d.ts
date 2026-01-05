/**
 * Type declarations for versioned ESM imports
 * This allows VS Code to recognize imports with version numbers
 */

// Sonner toast library
declare module 'sonner@2.0.3' {
  export * from 'sonner';
}

declare module 'sonner' {
  export interface ToastT {
    id: string | number;
    title?: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    cancel?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
    className?: string;
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    hotkey?: string[];
    richColors?: boolean;
    expand?: boolean;
    duration?: number;
    gap?: number;
    visibleToasts?: number;
    closeButton?: boolean;
    toastOptions?: {
      className?: string;
      descriptionClassName?: string;
      style?: React.CSSProperties;
    };
    className?: string;
    style?: React.CSSProperties;
    offset?: string | number;
    theme?: 'light' | 'dark' | 'system';
    dir?: 'ltr' | 'rtl' | 'auto';
  }

  export const Toaster: React.FC<ToasterProps>;
  
  export interface ToastOptions {
    id?: string | number;
    title?: string;
    description?: string;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
    cancel?: {
      label: string;
      onClick: () => void;
    };
    className?: string;
    descriptionClassName?: string;
    style?: React.CSSProperties;
  }

  export const toast: {
    (message: string, options?: ToastOptions): string | number;
    success: (message: string, options?: ToastOptions) => string | number;
    error: (message: string, options?: ToastOptions) => string | number;
    info: (message: string, options?: ToastOptions) => string | number;
    warning: (message: string, options?: ToastOptions) => string | number;
    loading: (message: string, options?: ToastOptions) => string | number;
    promise: <T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ) => Promise<T>;
    custom: (component: React.ReactNode, options?: ToastOptions) => string | number;
    dismiss: (id?: string | number) => void;
  };
}

// React Hook Form
declare module 'react-hook-form@7.55.0' {
  export * from 'react-hook-form';
}

// Motion (formerly Framer Motion)
declare module 'motion/react' {
  import type * as MotionTypes from 'framer-motion';
  
  export const motion: typeof MotionTypes.motion;
  export const AnimatePresence: typeof MotionTypes.AnimatePresence;
  export const MotionConfig: typeof MotionTypes.MotionConfig;
  export const LazyMotion: typeof MotionTypes.LazyMotion;
  export const domAnimation: typeof MotionTypes.domAnimation;
  export const domMax: typeof MotionTypes.domMax;
  export const m: typeof MotionTypes.m;
  
  export type Variants = MotionTypes.Variants;
  export type Variant = MotionTypes.Variant;
  export type Transition = MotionTypes.Transition;
  export type MotionProps = MotionTypes.MotionProps;
  export type AnimationProps = MotionTypes.AnimationProps;
  export type MotionStyle = MotionTypes.MotionStyle;
  export type MotionValue<T = any> = MotionTypes.MotionValue<T>;
  export type TargetAndTransition = MotionTypes.TargetAndTransition;
  export type AnimationControls = MotionTypes.AnimationControls;
  
  export const useMotionValue: typeof MotionTypes.useMotionValue;
  export const useTransform: typeof MotionTypes.useTransform;
  export const useSpring: typeof MotionTypes.useSpring;
  export const useScroll: typeof MotionTypes.useScroll;
  export const useAnimation: typeof MotionTypes.useAnimation;
  export const useAnimationControls: typeof MotionTypes.useAnimationControls;
  export const useInView: typeof MotionTypes.useInView;
}
