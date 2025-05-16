'use client';
import { useState, useCallback } from 'react';

// Amount to change zoom level by on each step
const ZOOM_STEP = 0.15;
// Minimum allowed zoom level (25%)
const MIN_ZOOM = 0.25;
// Maximum allowed zoom level (200%)
const MAX_ZOOM = 2;

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState(1);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
