import { useEffect } from 'react';

/**
 * Performance Monitoring Hook
 * Tracks component load times and reports web vitals
 */

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();

    // Report component mount time
    const reportMount = () => {
      const loadTime = performance.now() - startTime;
      console.log(`⚡ ${componentName} mounted in ${loadTime.toFixed(2)}ms`);
    };

    // Report after component is fully loaded
    if (document.readyState === 'complete') {
      reportMount();
    } else {
      window.addEventListener('load', reportMount);
      return () => window.removeEventListener('load', reportMount);
    }
  }, [componentName]);
}

/**
 * Web Vitals Reporter
 * Measures Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      console.log('📊 LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP not supported');
  }

  // First Input Delay (FID)
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('📊 FID:', entry.processingStart - entry.startTime);
      });
    });
    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID not supported');
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('📊 CLS:', clsValue);
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS not supported');
  }

  // First Contentful Paint (FCP)
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('📊 FCP:', entry.startTime);
      });
    });
    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    console.warn('FCP not supported');
  }

  // Time to First Byte (TTFB)
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    console.log('📊 TTFB:', ttfb);
  }
}

/**
 * Bundle Size Monitor
 * Reports transferred data size
 */
export function monitorBundleSize() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      totalSize += size;

      if (resource.name.endsWith('.js')) {
        jsSize += size;
      } else if (resource.name.endsWith('.css')) {
        cssSize += size;
      }
    });

    console.log('📦 Bundle Sizes:');
    console.log(`   Total: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`   JavaScript: ${(jsSize / 1024).toFixed(2)} KB`);
    console.log(`   CSS: ${(cssSize / 1024).toFixed(2)} KB`);
  });
}
