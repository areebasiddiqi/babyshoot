// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>()

  // Measure function execution time
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`❌ Operation failed: ${name} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }

  // Record performance metric
  private static recordMetric(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)!
    metrics.push(duration)
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  // Get performance statistics
  static getStats(name: string) {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const sorted = [...metrics].sort((a, b) => a - b)
    const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]

    return {
      count: metrics.length,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p95: Math.round(p95 * 100) / 100
    }
  }

  // Get all performance stats
  static getAllStats() {
    const stats: Record<string, any> = {}
    this.metrics.forEach((values, name) => {
      stats[name] = this.getStats(name)
    })
    return stats
  }

  // Log performance summary
  static logSummary() {
    const stats = this.getAllStats()
    console.group('🚀 Performance Summary')
    
    Object.entries(stats).forEach(([name, stat]) => {
      if (stat) {
        const status = stat.p95 > 1000 ? '🐌' : stat.p95 > 500 ? '⚠️' : '✅'
        console.log(`${status} ${name}: avg=${stat.avg}ms, p95=${stat.p95}ms (${stat.count} samples)`)
      }
    })
    
    console.groupEnd()
  }
}

// Web Vitals monitoring
export class WebVitalsMonitor {
  static init() {
    if (typeof window === 'undefined') return

    // Monitor Core Web Vitals
    this.observeWebVitals()
    
    // Monitor resource loading
    this.observeResourceTiming()
    
    // Monitor navigation timing
    this.observeNavigationTiming()
  }

  private static observeWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
      const lcp = lastEntry.renderTime || lastEntry.loadTime || 0
      
      if (lcp > 2500) {
        console.warn(`⚠️ Poor LCP: ${lcp}ms (should be < 2500ms)`)
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime
        if (fid > 100) {
          console.warn(`⚠️ Poor FID: ${fid}ms (should be < 100ms)`)
        }
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      if (clsValue > 0.1) {
        console.warn(`⚠️ Poor CLS: ${clsValue} (should be < 0.1)`)
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }

  private static observeResourceTiming() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming
        const duration = resourceEntry.responseEnd - resourceEntry.startTime
        
        // Flag slow resources
        if (duration > 3000) {
          console.warn(`🐌 Slow resource: ${resourceEntry.name} took ${duration}ms`)
        }
        
        // Flag large resources
        if (resourceEntry.transferSize && resourceEntry.transferSize > 1024 * 1024) { // 1MB
          console.warn(`📦 Large resource: ${resourceEntry.name} is ${(resourceEntry.transferSize / 1024 / 1024).toFixed(2)}MB`)
        }
      })
    }).observe({ entryTypes: ['resource'] })
  }

  private static observeNavigationTiming() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        const navEntry = entry as PerformanceNavigationTiming
        const ttfb = navEntry.responseStart - navEntry.requestStart
        const domLoad = navEntry.domContentLoadedEventEnd - navEntry.fetchStart
        const pageLoad = navEntry.loadEventEnd - navEntry.fetchStart
        
        console.group('📊 Navigation Timing')
        console.log(`TTFB: ${ttfb}ms`)
        console.log(`DOM Load: ${domLoad}ms`)
        console.log(`Page Load: ${pageLoad}ms`)
        console.groupEnd()
        
        if (ttfb > 600) {
          console.warn(`⚠️ Slow TTFB: ${ttfb}ms (should be < 600ms)`)
        }
      })
    }).observe({ entryTypes: ['navigation'] })
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  static logBundleInfo() {
    if (typeof window === 'undefined') return

    // Estimate bundle sizes from loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    let totalSize = 0

    scripts.forEach(async (script) => {
      const scriptElement = script as HTMLScriptElement
      try {
        const response = await fetch(scriptElement.src, { method: 'HEAD' })
        const size = parseInt(response.headers.get('content-length') || '0')
        totalSize += size
        
        if (size > 500 * 1024) { // 500KB
          console.warn(`📦 Large bundle: ${scriptElement.src} is ${(size / 1024).toFixed(2)}KB`)
        }
      } catch (error) {
        // Ignore CORS errors for external scripts
      }
    })

    console.log(`📊 Estimated total bundle size: ${(totalSize / 1024).toFixed(2)}KB`)
  }
}

// Initialize monitoring in browser
if (typeof window !== 'undefined') {
  WebVitalsMonitor.init()
  
  // Log performance summary every 30 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      PerformanceMonitor.logSummary()
    }, 30000)
  }
}
