import { useState, useRef, useCallback, useEffect } from 'react';

// Amount to change zoom level by on each step
const ZOOM_STEP = 0.01;
// Minimum allowed zoom level (25%)
const MIN_ZOOM = 0.25;
// Maximum allowed zoom level (200%)
const MAX_ZOOM = 2;
// Interval in milliseconds between continuous zoom steps
const ZOOM_INTERVAL = 30;

export function useZoom(initialZoom = 1) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const zoomIntervalRef = useRef<NodeJS.Timeout>(null);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const startContinuousZoom = useCallback((zoomFn: () => void) => {
    zoomFn();
    zoomIntervalRef.current = setInterval(zoomFn, ZOOM_INTERVAL);
  }, []);

  const stopContinuousZoom = useCallback(() => {
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    return () => stopContinuousZoom();
  }, [stopContinuousZoom]);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    startContinuousZoom,
    stopContinuousZoom,
  };
}
