import { useEffect } from 'react';

const PerfStats = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let raf = 0;
    let el: HTMLElement | null = null;
    let stats: any;
    const init = async () => {
      const StatsModule = await import('stats.js');
      const StatsCtor = (StatsModule as any).default || (StatsModule as any);
      stats = new StatsCtor();
      stats.showPanel(0);
      el = stats.dom as HTMLElement;
      el.style.position = 'fixed';
      el.style.right = '0px';
      el.style.top = '0px';
      el.style.zIndex = '99999';
      document.body.appendChild(el);
      const loop = () => {
        stats.begin();
        stats.end();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    init();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);
  return null;
};

export default PerfStats;
