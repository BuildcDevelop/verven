// src/hooks/useCanvas.ts
import { useRef, useEffect, useCallback, RefObject } from 'react';
import { Province } from '../types/game';

interface CanvasContextRef {
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
}

// Základní Canvas hook
export const useCanvasContext = (): [RefObject<HTMLCanvasElement>, CanvasContextRef] => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current && !contextRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        contextRef.current = context;
        // Nastavení základních vlastností
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
      }
    }
  }, []);

  return [canvasRef, { 
    canvas: canvasRef.current, 
    context: contextRef.current 
  }];
};

// Hook pro detekci kolizí s Path2D
export const useCanvasCollision = (context: CanvasRenderingContext2D | null) => {
  const getCanvasCoordinates = useCallback((
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const findClickedProvince = useCallback((
    provinces: Province[],
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): Province | null => {
    if (!context) return null;

    const { x, y } = getCanvasCoordinates(canvas, clientX, clientY);

    // Reverse order pro správné z-index detection
    for (let i = provinces.length - 1; i >= 0; i--) {
      const province = provinces[i];
      if (province.path && context.isPointInPath(province.path, x, y)) {
        return province;
      }
    }
    return null;
  }, [context, getCanvasCoordinates]);

  return { getCanvasCoordinates, findClickedProvince };
};

// Hook pro Canvas animace a rendering
export const useCanvasAnimation = (
  context: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null
) => {
  const animationFrameRef = useRef<number>();
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback((renderCallback: () => void) => {
    if (isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    
    const animate = () => {
      if (!isAnimatingRef.current) return;
      
      renderCallback();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [context, canvas]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return { startAnimation, stopAnimation, clearCanvas };
};

// Hook pro viewport culling (optimalizace)
export const useViewportCulling = () => {
  const isInViewport = useCallback((
    entity: { x: number; y: number; width: number; height: number },
    viewport: { x: number; y: number; width: number; height: number }
  ): boolean => {
    return !(
      entity.x + entity.width < viewport.x ||
      entity.x > viewport.x + viewport.width ||
      entity.y + entity.height < viewport.y ||
      entity.y > viewport.y + viewport.height
    );
  }, []);

  const getVisibleEntities = useCallback(<T extends { x: number; y: number; width: number; height: number }>(
    entities: T[],
    viewport: { x: number; y: number; width: number; height: number }
  ): T[] => {
    return entities.filter(entity => isInViewport(entity, viewport));
  }, [isInViewport]);

  return { isInViewport, getVisibleEntities };
};

// Hook pro Canvas responsivnost
export const useCanvasResponsive = (
  canvas: HTMLCanvasElement | null,
  container: HTMLElement | null
) => {
  const resizeCanvas = useCallback(() => {
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    
    // Nastavení skutečné velikosti canvas
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    
    // Nastavení CSS velikosti
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Škálování pro high-DPI displeje
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(devicePixelRatio, devicePixelRatio);
    }
  }, [canvas, container]);

  useEffect(() => {
    resizeCanvas();
    
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [resizeCanvas, container]);

  return { resizeCanvas };
};

// Komplexní Canvas hook pro game mapu
export const useGameCanvas = () => {
  const [canvasRef, { canvas, context }] = useCanvasContext();
  const { getCanvasCoordinates, findClickedProvince } = useCanvasCollision(context);
  const { startAnimation, stopAnimation, clearCanvas } = useCanvasAnimation(context, canvas);
  const { getVisibleEntities } = useViewportCulling();
  
  // Canvas utilit funkce specifické pro hru
  const drawProvince = useCallback((
    province: Province,
    isSelected: boolean = false,
    isHovered: boolean = false
  ) => {
    if (!context || !province.path) return;

    // Základní styling podle typu
    const provinceStyles = {
      own: { 
        fill: 'linear-gradient(135deg, #3498db, #2980b9)',
        border: '#3498db',
        shadow: 'rgba(52, 152, 219, 0.3)'
      },
      abandoned: { 
        fill: 'linear-gradient(135deg, #ecf0f1, #bdc3c7)',
        border: '#bdc3c7',
        shadow: 'rgba(236, 240, 241, 0.3)'
      },
      neutral: { 
        fill: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
        border: '#8e44ad',
        shadow: 'rgba(155, 89, 182, 0.3)'
      },
      ally: { 
        fill: 'linear-gradient(135deg, #2ecc71, #27ae60)',
        border: '#27ae60',
        shadow: 'rgba(46, 204, 113, 0.3)'
      },
      enemy: { 
        fill: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        border: '#c0392b',
        shadow: 'rgba(231, 76, 60, 0.3)'
      }
    };

    const style = provinceStyles[province.type];
    
    // Shadow efekt
    context.shadowColor = style.shadow;
    context.shadowBlur = isSelected ? 25 : (isHovered ? 15 : 10);
    context.shadowOffsetX = 0;
    context.shadowOffsetY = isSelected ? 8 : 4;

    // Fill
    // Poznámka: Pro Canvas gradients potřebujeme použít createLinearGradient
    context.fillStyle = style.border; // Prozatím solid color, gradients přidáme později
    context.fill(province.path);

    // Border
    context.strokeStyle = isSelected ? '#f1c40f' : style.border;
    context.lineWidth = isSelected ? 3 : 2;
    context.stroke(province.path);

    // Reset shadow
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }, [context]);

  return {
    canvasRef,
    canvas,
    context,
    
    // Collision detection
    getCanvasCoordinates,
    findClickedProvince,
    
    // Animation management
    startAnimation,
    stopAnimation,
    clearCanvas,
    
    // Viewport optimization
    getVisibleEntities,
    
    // Drawing functions
    drawProvince,
  };
};