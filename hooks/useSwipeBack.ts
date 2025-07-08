import { useEffect, useRef } from 'react';

const SWIPE_THRESHOLD_X = 75;
const SWIPE_MAX_Y = 80;
const SWIPE_TIMEOUT = 500;
const SWIPE_EDGE_WIDTH = 40;
const WHEEL_SWIPE_THRESHOLD_X = 40;

interface SwipeNavigateOptions {
  onSwipeBack?: () => void;
  onSwipeForward?: () => void;
  enabled?: boolean;
}

export const useSwipeBack = (options: SwipeNavigateOptions) => {
    const { onSwipeBack, onSwipeForward, enabled = true } = options;
    const touchStartRef = useRef<{ x: number; y: number; time: number; edge: 'left' | 'right' | null } | null>(null);
    const targetRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);
    const wheelDeltaX = useRef(0);
    const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const targetElement = targetRef.current;
        if (!targetElement || !enabled) {
            return;
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                const touchX = e.touches[0].clientX;
                let edge: 'left' | 'right' | null = null;
                
                if (onSwipeForward && touchX < SWIPE_EDGE_WIDTH) {
                    edge = 'left';
                } else if (onSwipeBack && touchX > window.innerWidth - SWIPE_EDGE_WIDTH) {
                    edge = 'right';
                }
                
                if (edge) {
                    touchStartRef.current = {
                        x: touchX,
                        y: e.touches[0].clientY,
                        time: Date.now(),
                        edge: edge,
                    };
                    isDraggingRef.current = false;
                } else {
                    touchStartRef.current = null;
                }
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current || e.touches.length !== 1) return;

            const touchCurrentX = e.touches[0].clientX;
            const deltaX = touchCurrentX - touchStartRef.current.x;
            const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

            if (!isDraggingRef.current && deltaY > Math.abs(deltaX) && deltaY > 10) {
                touchStartRef.current = null;
                return;
            }

            const isBackSwipe = touchStartRef.current.edge === 'right' && deltaX < 0;
            const isForwardSwipe = touchStartRef.current.edge === 'left' && deltaX > 0;

            if (isBackSwipe || isForwardSwipe) {
                if (!isDraggingRef.current) {
                    isDraggingRef.current = true;
                    targetElement.style.transition = 'none';
                }
                const pullRatio = Math.max(0, Math.abs(deltaX) / targetElement.clientWidth);
                const opacity = Math.max(1 - pullRatio * 1.5, 0.4);
                targetElement.style.transform = `translateX(${deltaX}px)`;
                targetElement.style.opacity = `${opacity}`;
            }
        };
        
        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current || e.changedTouches.length === 0) return;

            const wasDragging = isDraggingRef.current;
            isDraggingRef.current = false;
            
            targetElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

            const { x: startX, y: startY, time: startTime, edge } = touchStartRef.current;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaTime = Date.now() - startTime;

            const deltaX = endX - startX;
            const deltaY = Math.abs(endY - startY);

            touchStartRef.current = null;

            if (wasDragging && deltaTime < SWIPE_TIMEOUT && deltaY < SWIPE_MAX_Y) {
                if (edge === 'right' && deltaX < -SWIPE_THRESHOLD_X) {
                    onSwipeBack?.();
                } else if (edge === 'left' && deltaX > SWIPE_THRESHOLD_X) {
                    onSwipeForward?.();
                } else {
                    targetElement.style.transform = 'translateX(0px)';
                    targetElement.style.opacity = '1';
                }
            } else if (wasDragging) {
                targetElement.style.transform = 'translateX(0px)';
                targetElement.style.opacity = '1';
            }
        };

        const handleTouchCancel = () => {
             if (isDraggingRef.current) {
                targetElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                targetElement.style.transform = 'translateX(0px)';
                targetElement.style.opacity = '1';
            }
            isDraggingRef.current = false;
            touchStartRef.current = null;
        };
        
        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                // This is a horizontal swipe on a trackpad
                e.preventDefault();
                wheelDeltaX.current += e.deltaX;

                if (wheelTimeout.current) {
                    clearTimeout(wheelTimeout.current);
                }

                wheelTimeout.current = setTimeout(() => {
                    wheelDeltaX.current = 0;
                }, 150);
                
                // Note: Standard trackpad behavior is swipe-left-to-go-forward (positive deltaX)
                // and swipe-right-to-go-back (negative deltaX)
                if (wheelDeltaX.current > WHEEL_SWIPE_THRESHOLD_X && onSwipeForward) {
                    onSwipeForward();
                    wheelDeltaX.current = 0;
                } else if (wheelDeltaX.current < -WHEEL_SWIPE_THRESHOLD_X && onSwipeBack) {
                    onSwipeBack();
                    wheelDeltaX.current = 0;
                }
            }
        };

        targetElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        targetElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        targetElement.addEventListener('touchend', handleTouchEnd, { passive: true });
        targetElement.addEventListener('touchcancel', handleTouchCancel, { passive: true });
        targetElement.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            if (targetElement) {
                targetElement.removeEventListener('touchstart', handleTouchStart);
                targetElement.removeEventListener('touchmove', handleTouchMove);
                targetElement.removeEventListener('touchend', handleTouchEnd);
                targetElement.removeEventListener('touchcancel', handleTouchCancel);
                targetElement.removeEventListener('wheel', handleWheel);
                targetElement.style.transform = '';
                targetElement.style.opacity = '';
                targetElement.style.transition = '';
            }
        };
    }, [onSwipeBack, onSwipeForward, enabled]);

    return targetRef;
};