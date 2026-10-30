"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { HubspotProvider } from "next-hubspot";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

// Tracks pageviews. Kept in its own component so the `useSearchParams()` call
// sits behind a Suspense boundary, which is required for static prerendering.
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Track pageviews
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function Provider({ children }) {
  return (
    <>
      <PostHogProvider client={posthog}>
        <Suspense>
          <PageViewTracker />
        </Suspense>
        <HubspotProvider>{children}</HubspotProvider>
      </PostHogProvider>
    </>
  );
}
