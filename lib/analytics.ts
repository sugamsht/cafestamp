type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export const trackEvent = (name: string, properties?: AnalyticsProperties) => {
  if (import.meta.env.DEV) return;
  void (async () => {
    try {
      const { track } = await import("@vercel/analytics");
      track(name, properties);
    } catch {
      // Analytics should never block product behavior.
    }
  })();
};
