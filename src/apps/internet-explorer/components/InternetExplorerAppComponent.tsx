import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { AppProps } from "../../base/types";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { Input } from "@/components/ui/input";
import { InternetExplorerMenuBar } from "./InternetExplorerMenuBar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { InputDialog } from "@/components/dialogs/InputDialog";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { helpItems, appMetadata } from "..";
import HtmlPreview from "@/components/shared/HtmlPreview";
import { motion, AnimatePresence } from "framer-motion";
import { useAiGeneration } from "../hooks/useAiGeneration";
import { useInternetExplorerStore, DEFAULT_FAVORITES, ErrorResponse } from "@/stores/useInternetExplorerStore";
import FutureSettingsDialog from "@/components/dialogs/FutureSettingsDialog";
import { useTerminalSounds } from "@/hooks/useTerminalSounds";
import { track } from "@vercel/analytics";
import { useAppStore } from "@/stores/useAppStore";

// Analytics event namespace for Internet Explorer events
export const IE_ANALYTICS = {
  NAVIGATION_START: "internet-explorer:navigation_start",
  NAVIGATION_ERROR: "internet-explorer:navigation_error",
  NAVIGATION_SUCCESS: "internet-explorer:navigation_success",
};

interface ErrorPageProps {
  title: string;
  primaryMessage: string;
  secondaryMessage?: string;
  suggestions: (string | ReactNode)[];
  details?: string;
  footerText: string;
  showGoBackButtonInSuggestions?: boolean;
  onGoBack: () => void;
  onRetry?: () => void;
}

function ErrorPage({
  title,
  primaryMessage,
  secondaryMessage,
  suggestions,
  details,
  footerText,
  showGoBackButtonInSuggestions = true,
  onGoBack,
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="p-6 font-geneva-12 text-sm h-full overflow-y-auto">
      <h1 className="text-lg mb-4 font-normal flex items-center">{title}</h1>

      <p className="mb-3">{primaryMessage}</p>
      {secondaryMessage && <p className="mb-3">{secondaryMessage}</p>}

      <div className="h-px bg-gray-300 my-5"></div>

      <p className="mb-3">Please try the following:</p>

      <ul className="list-disc pl-6 mb-5 space-y-2">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            {typeof suggestion === 'string' && suggestion.includes('{hostname}') ? (
              // Special handling for hostname link (assuming details contains hostname)
              suggestion.split('{hostname}').map((part, i) => 
                i === 0 ? part : <><a href={`https://${details}`} target="_blank" rel="noopener noreferrer" className="text-red-600 underline">{details}</a>{part}</>
              )
            ) : typeof suggestion === 'string' && suggestion.includes('{backButton}') && showGoBackButtonInSuggestions ? (
              // Special handling for inline back button
              suggestion.split('{backButton}').map((part, i) => 
                i === 0 ? part : <><a href="#" role="button" onClick={(e) => { e.preventDefault(); onGoBack(); }} className="text-red-600 underline">Back</a>{part}</>
              )
            ) : typeof suggestion === 'string' && suggestion.includes('{refreshButton}') && onRetry ? (
              // Special handling for inline refresh button
              suggestion.split('{refreshButton}').map((part, i) =>
                i === 0 ? part : <><a href="#" role="button" onClick={(e) => { e.preventDefault(); onRetry(); }} className="text-red-600 underline">Refresh</a>{part}</>
              )
            ) : (
              suggestion // Render directly if it's a node or simple string
            )}
          </li>
        ))}
      </ul>

      {details && !footerText.includes('HTTP') && ( // Don't show details box if info is in footer
        <div className="p-3 bg-gray-100 border border-gray-300 rounded mb-5">
          {details}
        </div>
      )}

      <div className="mt-10 text-gray-700 whitespace-pre-wrap">
        {footerText}
      </div>
    </div>
  );
}

// Add this constant for title truncation
const MAX_TITLE_LENGTH = 50;

// Add these utility functions after the imports and before the component
const getHostnameFromUrl = (url: string): string => {
  try {
    const urlToUse = url.startsWith("http") ? url : `https://${url}`;
    return new URL(urlToUse).hostname;
  } catch {
    return url; // Return original if parsing fails
  }
};

const formatTitle = (title: string): string => {
  if (!title) return "Internet Explorer";
  return title.length > MAX_TITLE_LENGTH 
    ? title.substring(0, MAX_TITLE_LENGTH) + "..."
    : title;
};

const getLoadingTitle = (baseTitle: string): string => {
  // If it looks like a URL, extract the hostname
  const titleToUse = baseTitle.includes("/") || baseTitle.includes(".") 
    ? getHostnameFromUrl(baseTitle)
    : baseTitle;
  
  const formattedTitle = formatTitle(titleToUse);
  return formattedTitle === "Internet Explorer" 
    ? "Internet Explorer - Loading" 
    : `${formattedTitle} - Loading`;
};

export function InternetExplorerAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
}: AppProps) {
  // Add debugMode and terminalSoundsEnabled from useAppStore
  const debugMode = useAppStore(state => state.debugMode);
  const terminalSoundsEnabled = useAppStore(state => state.terminalSoundsEnabled);
  const bringToForeground = useAppStore(state => state.bringToForeground);

  // --- Store Selectors/Actions (Destructure them here for stability in callbacks) ---
  const {
    // State
    url, year, mode, token, favorites, history, historyIndex,
    isTitleDialogOpen, newFavoriteTitle, isHelpDialogOpen, isAboutDialogOpen,
    isNavigatingHistory, isClearFavoritesDialogOpen, isClearHistoryDialogOpen, currentPageTitle,
    timelineSettings, status, finalUrl, aiGeneratedHtml,
    // New state from store
    errorDetails, 
    isResetFavoritesDialogOpen,
    isFutureSettingsDialogOpen,

    // Actions
    setUrl, setYear, navigateStart, setFinalUrl, loadSuccess, loadError, cancel,
    addFavorite, clearFavorites, setHistoryIndex, clearHistory,
    setTitleDialogOpen, setNewFavoriteTitle, setHelpDialogOpen,
    setAboutDialogOpen, setNavigatingHistory, setClearFavoritesDialogOpen,
    setClearHistoryDialogOpen,
    // New actions from store
    handleNavigationError,
    setPrefetchedTitle, // Needed if setting prefetched title outside store actions
    clearErrorDetails,
    setResetFavoritesDialogOpen, // New
    setFutureSettingsDialogOpen, // New
    getCachedAiPage, // Keep this one, used in handleNavigate
  } = useInternetExplorerStore();

  // Unified AbortController for cancellations
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Keep component-level state for UI/DOM elements ---
  const [hasMoreToScroll, setHasMoreToScroll] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const favoritesContainerRef = useRef<HTMLDivElement>(null);

  // AI generation hook with custom timeline from store
  const {
    generateFuturisticWebsite,
    aiGeneratedHtml: generatedHtml, // Renamed to avoid conflict with store state
    isAiLoading,
    isFetchingWebsiteContent, // Get the new state
    stopGeneration
  } = useAiGeneration({ 
    onLoadingChange: () => {}, 
    customTimeline: timelineSettings 
  });

  // Add terminal sounds hook
  const { playElevatorMusic, stopElevatorMusic, playDingSound } = useTerminalSounds();

  // Create past/future years arrays (keep this logic)
  const currentYear = new Date().getFullYear();
  const pastYears = [
    // Historical centuries
    "1000 BC", "1 CE", "500", "800", "1000", "1200", "1400", "1600", "1700", "1800", "1900",
    // Early 20th century decades
    "1910", "1920", "1930", "1940", "1950", "1960", "1970", "1980", "1985", "1990",
    // Modern years
    ...Array.from(
      { length: currentYear - 1991 + 1 },
      (_, i) => (1991 + i).toString()
    ).filter(year => parseInt(year) !== currentYear) // Filter out current year
  ].reverse();
  const futureYears = [
    // Near‑future (every decade up to 2100)
    ...Array.from(
      { length: 8 }, 
      (_, i) => (2030 + i * 10).toString()
    ).filter(year => parseInt(year) !== currentYear), // Filter out current year if it's 2030
    // Mid & far‑future milestones
    "2150", "2200", "2250", "2300", "2400", "2500", "2750", "3000"
  ].sort((a, b) => parseInt(b) - parseInt(a));

  // Add new state for tracking the current display title
  const [displayTitle, setDisplayTitle] = useState<string>("Internet Explorer");

  // Update title when we get it from various sources
  useEffect(() => {
    let newTitle = "Internet Explorer";
    const baseTitle = currentPageTitle || url; // Use current URL if no title yet
    
    // Simplified condition: Show "Time Travelling" if loading and year is not "current"
    const isTimeTravelling = status === 'loading' && year !== 'current';

    if (isTimeTravelling) {
      // Time Travelling
      const titleToUse = baseTitle.includes("/") || baseTitle.includes(".") 
        ? getHostnameFromUrl(baseTitle)
        : baseTitle;
      const formattedTitle = formatTitle(titleToUse);
      newTitle = formattedTitle === "Internet Explorer" 
        ? "Internet Explorer - Time Travelling" 
        : `${formattedTitle} - Time Travelling`;
    } else if (status === "loading") {
      // Regular loading (year is "current")
      newTitle = getLoadingTitle(baseTitle);
    } else if (currentPageTitle) {
      // Success with title
      newTitle = formatTitle(currentPageTitle);
    } else if (finalUrl) {
      // Success without title, use hostname
      try {
        // Ensure finalUrl is treated as a URL
        const urlToParse = finalUrl.startsWith("http") || finalUrl.startsWith("/") ? finalUrl : `https://${finalUrl}`;
        // Handle potential proxy URLs
        const effectiveUrl = urlToParse.startsWith('/api/iframe-check') ? url : urlToParse; 
        const hostname = new URL(effectiveUrl).hostname;
        newTitle = formatTitle(hostname);
      } catch {
        // Fallback to original URL if parsing fails, then get hostname
        try {
          const fallbackHostname = getHostnameFromUrl(url);
          newTitle = formatTitle(fallbackHostname);
        } catch {
          console.debug("[IE] Failed to parse both finalUrl and url for title:", finalUrl, url);
          newTitle = "Internet Explorer"; // Ultimate fallback
        }
      }
    }

    setDisplayTitle(newTitle);
  }, [status, currentPageTitle, finalUrl, url, year]); 

  // --- Callback Handlers (Update to use store actions/state) ---

  // Helper function to get Wayback URL (can remain outside useCallback for now)
  const getWaybackUrl = async (targetUrl: string, year: string) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const formattedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
    console.log(`[IE] Using Wayback Machine URL for ${formattedUrl} in ${year}`);
    return `/api/iframe-check?url=${encodeURIComponent(formattedUrl)}&year=${year}&month=${month}`;
  };

  // Handler for iframe load
  const handleIframeLoad = async () => {
    if (iframeRef.current && iframeRef.current.dataset.navToken === token.toString()) {
      const iframeSrc = iframeRef.current.src;
      // Check if the source is our proxy/check endpoint
      if (iframeSrc.includes('/api/iframe-check') && iframeRef.current.contentDocument) {
        try {
          // Attempt to read the body content directly as text
          const textContent = iframeRef.current.contentDocument.body?.textContent?.trim();
          if (textContent) {
            // Try parsing the text content as JSON
            try {
              const potentialErrorData = JSON.parse(textContent) as ErrorResponse;
              // Check if it looks like our error structure
              if (potentialErrorData && potentialErrorData.error === true && potentialErrorData.type) {
                console.log('[IE] Detected JSON error response in iframe body:', potentialErrorData);
                // Track navigation error
                track(IE_ANALYTICS.NAVIGATION_ERROR, {
                  url: iframeSrc, // Log the proxy URL that returned the error
                  type: potentialErrorData.type,
                  status: potentialErrorData.status || 500,
                  message: potentialErrorData.message,
                });
                // Use store action to set error details
                handleNavigationError(potentialErrorData, url); // Use original requested URL for context
                return; // Stop further processing
              }
            } catch (parseError) {
              // It wasn't JSON or not our error format, proceed with normal loading checks
              console.debug('[IE] Iframe body content was not a JSON error:', parseError);
            }
          }

          // Original content type check (fallback or for non-error JSON cases if any)
          const contentType = iframeRef.current.contentDocument.contentType;
          if (contentType === 'application/json') {
              // This block might be redundant now if the above handles errors,
              // but keep it in case the proxy returns non-error JSON for some reason.
              const text = iframeRef.current.contentDocument.body.textContent;
              if (text) {
                  const errorData = JSON.parse(text) as ErrorResponse;
                  if (errorData.error) {
                      console.log('[IE] Detected error response (via content-type check):', errorData);
                      track(IE_ANALYTICS.NAVIGATION_ERROR, {
                          url: iframeSrc,
                          type: errorData.type,
                          status: errorData.status || 500,
                      });
                      handleNavigationError(errorData, url);
                      return;
                  }
              }
          }
        } catch (error) {
          console.warn('[IE] Error processing iframe content:', error);
          // Potentially fall through to success if error handling failed,
          // or consider triggering a generic error here?
        }
      }

      // --- If no JSON error was detected and handled, proceed with success logic ---

      // Reset error details on successful load using store action
      clearErrorDetails();

      setTimeout(() => {
        if (iframeRef.current && iframeRef.current.dataset.navToken === token.toString()) {
          let loadedTitle: string | null = null;
          const currentUrlForFallback = url; // Capture current url from store state
          const fallbackTitle = currentUrlForFallback ? new URL(currentUrlForFallback.startsWith("http") ? currentUrlForFallback : `https://${currentUrlForFallback}`).hostname : "Internet Explorer";

          // Title extraction logic (remains similar, but uses loadSuccess)
          try {
            loadedTitle = iframeRef.current?.contentDocument?.title || null;
            if (loadedTitle) {
              const txt = document.createElement("textarea");
              txt.innerHTML = loadedTitle;
              loadedTitle = txt.value.trim();
            }
          } catch (error) {
            console.warn("[IE] Failed to read iframe document title directly:", error);
          }

          if (!loadedTitle && finalUrl?.startsWith('/api/iframe-check')) {
            try {
              const metaTitle = iframeRef.current?.contentDocument?.querySelector('meta[name="page-title"]')?.getAttribute('content');
              if (metaTitle) {
                loadedTitle = decodeURIComponent(metaTitle);
              }
            } catch (error) {
              console.warn("[IE] Failed to read page-title meta tag:", error);
            }
          }

          const favicon = `https://www.google.com/s2/favicons?domain=${new URL(currentUrlForFallback.startsWith("http") ? currentUrlForFallback : `https://${currentUrlForFallback}`).hostname}&sz=32`;
          
          // Track navigation success
          track(IE_ANALYTICS.NAVIGATION_SUCCESS, {
            url: currentUrlForFallback,
            year: year,
            mode: mode,
            title: loadedTitle || fallbackTitle,
          });

          // Call loadSuccess from store
          loadSuccess({
            title: loadedTitle || fallbackTitle, // Pass extracted or fallback title
            targetUrl: currentUrlForFallback, // Pass current URL from state
            targetYear: year, // Pass current year from state
            favicon: favicon,
            addToHistory: !isNavigatingHistory // Use state flag
          });
          
          // No need to manually reset prefetchedTitle here, store action does it
        }
      }, 50);
    }
  };

  // Handler for iframe error
  const handleIframeError = () => {
    if (iframeRef.current && iframeRef.current.dataset.navToken === token.toString()) {
      setTimeout(() => {
        if (iframeRef.current && iframeRef.current.dataset.navToken === token.toString()) {
          try {
            const targetUrlForError = finalUrl || url; // Use the URL that was attempted
            // Track navigation error
            track(IE_ANALYTICS.NAVIGATION_ERROR, {
              url: targetUrlForError,
              type: "connection_error",
              status: 404,
            });
            // Use store action to set error details
            handleNavigationError({
              error: true,
              type: "connection_error",
              status: 404, // Assuming 404 or similar client-side load issue
              message: `Cannot access ${targetUrlForError}. The website might be blocking access or requires authentication.`,
              details: "The page could not be loaded in the iframe. This could be due to security restrictions or network issues.",
              // hostname is set within handleNavigationError action
            }, targetUrlForError);
          } catch (error) {
            const errorMsg = `Cannot access the requested website. ${error instanceof Error ? error.message : String(error)}`;
            // Track navigation error
            track(IE_ANALYTICS.NAVIGATION_ERROR, {
              url: finalUrl || url,
              type: "generic_error",
              error: errorMsg,
            });
            // Use store action for generic fallback error
            loadError(errorMsg, { 
              error: true, 
              type: "generic_error", 
              message: errorMsg 
            }); 
          }
        }
      }, 50);
    }
  };

  // Main navigation handler (updated to use store actions)
  const handleNavigate = useCallback(async (
    targetUrlParam: string = url, // Use different param name to avoid shadowing store state
    targetYearParam: string = year,
    forceRegenerate = false,
    currentHtmlContent: string | null = null // Add parameter for context
  ) => {
    // Reset error state using store action
    clearErrorDetails();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (isAiLoading) {
      stopGeneration();
    }
    if (iframeRef.current && status === 'loading') {
      iframeRef.current.src = 'about:blank';
    }

    const newMode = targetYearParam === "current"
      ? "now"
      : parseInt(targetYearParam) > new Date().getFullYear()
        ? "future"
        : "past";
    const newToken = Date.now();

    // Track navigation start
    track(IE_ANALYTICS.NAVIGATION_START, {
      url: targetUrlParam,
      year: targetYearParam,
      mode: newMode,
    });

    // Start navigation using store action
    navigateStart(targetUrlParam, targetYearParam, newMode, newToken);

    const normalizedTargetUrl = targetUrlParam.startsWith("http")
      ? targetUrlParam
      : `https://${targetUrlParam}`;

    try {
      if (newMode === "future" || (newMode === "past" && parseInt(targetYearParam) <= 1995)) {
        // AI generation branch (uses hook, updates store via loadSuccess/loadError/cacheAiPage within hook or here)
        
        // Check for cached AI page first
        const cachedEntry = getCachedAiPage(normalizedTargetUrl, targetYearParam);
        if (cachedEntry && !forceRegenerate) {
          console.log(`[IE] Using cached AI page for ${normalizedTargetUrl} in ${targetYearParam}`);
          const favicon = `https://www.google.com/s2/favicons?domain=${new URL(normalizedTargetUrl).hostname}&sz=32`;
          loadSuccess({ 
            aiGeneratedHtml: cachedEntry.html, 
            title: cachedEntry.title || normalizedTargetUrl, 
            targetUrl: normalizedTargetUrl, 
            targetYear: targetYearParam, 
            favicon: favicon, 
            addToHistory: true 
          });
          return;
        }
        
        // No cached content, need to generate - start music now
        if (playElevatorMusic && terminalSoundsEnabled) {
          playElevatorMusic(newMode);
        }
        
        try {
          await generateFuturisticWebsite(
            normalizedTargetUrl,
            targetYearParam,
            forceRegenerate,
            abortController.signal,
            null, // Pass null for prefetchedTitle, store handles it
            currentHtmlContent // Pass through the current HTML content
          );
          if (abortController.signal.aborted) return;
        } catch (error) {
          if (abortController.signal.aborted) return;
          console.error("[IE] AI generation error:", error);
          handleNavigationError({
            error: true,
            type: "ai_generation_error",
            message: "Failed to generate futuristic website. AI model may not be selected.",
            details: error instanceof Error ? error.message : String(error)
          }, normalizedTargetUrl);
          return;
        }
        // Assuming generateFuturisticWebsite calls loadSuccess/loadError/cacheAiPage internally

      } else {
        // Non-AI branch (Wayback/Proxy/Direct)
        const cachedEntry = getCachedAiPage(normalizedTargetUrl, targetYearParam);
        if (cachedEntry && !forceRegenerate) {
          console.log(`[IE] Using cached AI page for ${normalizedTargetUrl} in ${targetYearParam}`);
          const favicon = `https://www.google.com/s2/favicons?domain=${new URL(normalizedTargetUrl).hostname}&sz=32`;
          loadSuccess({ 
            aiGeneratedHtml: cachedEntry.html, 
            title: cachedEntry.title || normalizedTargetUrl, 
            targetUrl: normalizedTargetUrl, 
            targetYear: targetYearParam, 
            favicon: favicon, 
            addToHistory: true 
          });
          return;
        }

        let urlToLoad = normalizedTargetUrl;
        let requiresProxyCheck = false;

        if (newMode === "past") {
          try {
            const waybackUrl = await getWaybackUrl(normalizedTargetUrl, targetYearParam);
            if (abortController.signal.aborted) return;
            if (waybackUrl) {
              urlToLoad = waybackUrl;
              // Don't set requiresProxyCheck for Wayback URLs - we know they need proxying
              // and the proxy endpoint already handles them correctly
            } else {
              // Fallback to AI if no Wayback URL
              await generateFuturisticWebsite(
                normalizedTargetUrl, 
                targetYearParam, 
                forceRegenerate, 
                abortController.signal, 
                null,
                currentHtmlContent // Pass context here too
              );
              if (abortController.signal.aborted) return;
              return;
            }
          } catch (waybackError) {
            if (abortController.signal.aborted) return;
            console.warn(`[IE] Wayback Machine error for ${normalizedTargetUrl}:`, waybackError);
            // Fallback to AI
            await generateFuturisticWebsite(
              normalizedTargetUrl, 
              targetYearParam, 
              forceRegenerate, 
              abortController.signal, 
              null,
              currentHtmlContent // And here
            );
            if (abortController.signal.aborted) return;
            return;
          }
        } else if (newMode === "now") {
          // Direct load / check & proxy logic
          try {
            const checkRes = await fetch(
              `/api/iframe-check?mode=check&url=${encodeURIComponent(normalizedTargetUrl)}`,
              { signal: abortController.signal }
            );
            if (abortController.signal.aborted) return;

            if (checkRes.ok) {
              const checkData = await checkRes.json(); // Assume IframeCheckResponse structure
              if (checkData.allowed) {
                urlToLoad = normalizedTargetUrl;
                if (checkData.title) {
                  // Use store action to set prefetched title
                  setPrefetchedTitle(checkData.title);
                }
              } else {
                urlToLoad = `/api/iframe-check?url=${encodeURIComponent(normalizedTargetUrl)}`;
                requiresProxyCheck = true; // Proxy endpoint used
              }
            } else {
              console.warn(`[IE] iframe-check failed (${checkRes.status}), attempting direct.`);
              urlToLoad = normalizedTargetUrl;
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            console.warn(`[IE] iframe-check fetch failed, attempting direct:`, error);
            urlToLoad = normalizedTargetUrl;
          }
        }
        
        // Pre-flight check for proxy URLs before setting finalUrl
        // Skip pre-flight check for Wayback Machine URLs since we know they need proxying
        if (requiresProxyCheck && !urlToLoad.includes('/web/')) {
            try {
                const proxyResponse = await fetch(urlToLoad, { signal: abortController.signal });
                if (abortController.signal.aborted) return;
                const contentType = proxyResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await proxyResponse.json() as ErrorResponse;
                    if (errorData.error) {
                        console.log('[IE] Detected proxy error response during pre-flight:', errorData);
                        handleNavigationError(errorData, urlToLoad); // Use store action
                        return;
                    }
                }
                // If pre-flight succeeds, proceed with iframe load
            } catch (proxyError) {
                if (abortController.signal.aborted) return;
                console.warn('[IE] Error pre-fetching proxy content:', proxyError);
                handleNavigationError({ // Use store action
                  error: true,
                  type: "connection_error",
                  status: 503,
                  message: "Failed to connect to the proxy service.",
                  details: proxyError instanceof Error ? proxyError.message : String(proxyError)
                }, urlToLoad);
                return;
            }
        }

        // Add cache buster if needed (check against store's finalUrl)
        if (urlToLoad === finalUrl) {
          urlToLoad = `${urlToLoad}${urlToLoad.includes("?") ? "&" : "?"}_t=${Date.now()}`;
        }

        // Update final URL in store
        setFinalUrl(urlToLoad);

        if (iframeRef.current) {
          iframeRef.current.dataset.navToken = newToken.toString();
          iframeRef.current.src = urlToLoad;
        }
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error(`[IE] Navigation error:`, error);
        // Use store action for general navigation errors
        handleNavigationError({
          error: true,
          type: "navigation_error",
          message: `Failed to navigate: ${error instanceof Error ? error.message : String(error)}`,
          details: error instanceof Error ? error.stack : undefined
        }, normalizedTargetUrl); // Pass the URL that caused the error
      }
    }
  // Add store actions/state used in the function to dependency array
  }, [url, year, finalUrl, status, token, isAiLoading, isNavigatingHistory, currentPageTitle, aiGeneratedHtml,
      navigateStart, setFinalUrl, loadError, generateFuturisticWebsite, stopGeneration, loadSuccess, getCachedAiPage,
      clearErrorDetails, handleNavigationError, setPrefetchedTitle, setYear, setUrl, // Added store actions
      // Removed component state setters: setErrorAndStopLoading, clearErrorDetails
      // Keep component refs/state if used indirectly: none here?
      ]);

  // --- Other Callbacks (Update to use store actions/state) ---

  const handleNavigateWithHistory = useCallback(async (
    targetUrl: string,
    targetYear?: string
  ) => {
    // Use store action directly
    setNavigatingHistory(false);
    handleNavigate(targetUrl, targetYear || year, false); // Use current year from store if not provided
  }, [handleNavigate, setNavigatingHistory, year]);

  const handleGoBack = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setNavigatingHistory(true);
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const entry = history[nextIndex];
      handleNavigate(entry.url, entry.year || "current", false); // Use handleNavigate
      // setNavigatingHistory(false); // Let handleNavigate handle it? Or set in loadSuccess?
      // Let's ensure addToHistory is false in loadSuccess when isNavigatingHistory is true.
      // No need to set it back to false here.
    }
  }, [history, historyIndex, setHistoryIndex, handleNavigate, setNavigatingHistory]);

  const handleGoForward = useCallback(() => {
    if (historyIndex > 0) {
      setNavigatingHistory(true);
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      const entry = history[nextIndex];
      handleNavigate(entry.url, entry.year || "current", false);
      // setNavigatingHistory(false); // See comment in handleGoBack
    }
  }, [history, historyIndex, setHistoryIndex, handleNavigate, setNavigatingHistory]);

  const handleAddFavorite = useCallback(() => {
    // Use store state and actions
    const titleSource = currentPageTitle || (finalUrl ? new URL(finalUrl).hostname : (url ? new URL(url.startsWith("http") ? url : `https://${url}`).hostname : "Page"));
    setNewFavoriteTitle(titleSource);
    setTitleDialogOpen(true);
  }, [currentPageTitle, finalUrl, url, setNewFavoriteTitle, setTitleDialogOpen]);

  const handleTitleSubmit = useCallback(() => {
    if (!newFavoriteTitle) return;
    // Use store state and actions
    const favUrl = url; // Use current URL from state
    const favHostname = finalUrl ? new URL(finalUrl).hostname : (favUrl ? new URL(favUrl.startsWith("http") ? favUrl : `https://${favUrl}`).hostname : "unknown.com");
    const favIcon = `https://www.google.com/s2/favicons?domain=${favHostname}&sz=32`;
    addFavorite({
      title: newFavoriteTitle,
      url: favUrl,
      favicon: favIcon,
      year: year !== "current" ? year : undefined, // Use year from store
    });
    setTitleDialogOpen(false);
  }, [newFavoriteTitle, addFavorite, finalUrl, url, year, setTitleDialogOpen]);

  // Use store action for resetting favorites
  const handleResetFavorites = useCallback(() => {
    // Reset favorites to DEFAULT_FAVORITES - This logic should be in the store action itself.
    // Let's assume clearFavorites() followed by adding defaults, or a specific reset action.
    // For now, just call the dialog setter.
    // Modify the store to have a proper reset action if needed.
    clearFavorites(); // Clear existing
    DEFAULT_FAVORITES.forEach(fav => addFavorite(fav)); // Add defaults
    setResetFavoritesDialogOpen(false);
  }, [clearFavorites, addFavorite, setResetFavoritesDialogOpen]); // Update if store gets a dedicated reset action

  const handleClearFavorites = useCallback(() => {
    // Use store actions
    clearFavorites();
    setClearFavoritesDialogOpen(false);
  }, [clearFavorites, setClearFavoritesDialogOpen]);

  const handleRefresh = useCallback(() => {
    // Clear any existing navigation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
    
    // Navigate with force refresh
    handleNavigate(url, year, true);
  }, [handleNavigate, url, year]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Use store action
    cancel();
    if (isAiLoading) {
      stopGeneration();
    }
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
    }
    // Clear error details via store action
    clearErrorDetails();
    
    // Force reset all loading states immediately
    if (stopElevatorMusic) {
      stopElevatorMusic();
    }
  }, [cancel, isAiLoading, stopGeneration, clearErrorDetails, stopElevatorMusic]);

  const handleGoToUrl = useCallback(() => {
    urlInputRef.current?.focus();
    urlInputRef.current?.select();
  }, []);

  const handleHome = useCallback(() => {
    // Use handleNavigate with default home params
    handleNavigate("apple.com", "2002"); // Example home page
  }, [handleNavigate]);

  // --- Effects ---

  // Effect to handle initial navigation (Keep this, but ensure handleNavigate is stable)
  useEffect(() => {
    // Use the callback version of handleNavigate
    // Check if initial load is needed? Or does handleNavigate handle this?
    // Assuming handleNavigate is safe to call on mount based on initial store state.
    handleNavigate(url, year, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Effect to handle messages from the iframe (Keep this, logic uses store actions)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === "iframeNavigation" &&
        typeof event.data.url === "string"
      ) {
        console.log(`[IE] Received navigation request from iframe: ${event.data.url}`);
        // Use store state for year
        handleNavigate(event.data.url, year);
      } else if (event.data && event.data.type === "goBack") {
        console.log(`[IE] Received back button request from iframe`);
        handleGoBack(); // Uses store action via useCallback wrapper
      } else if (
        event.data &&
        event.data.type === "aiHtmlNavigation" &&
        typeof event.data.url === "string"
      ) {
        console.log(`[IE] Received navigation request from AI HTML preview: ${event.data.url}`);
        // Use store state for year - navigate in the *same* year as the current AI view
        // Pass the *current* AI-generated HTML as context
        handleNavigate(event.data.url, year, false, aiGeneratedHtml);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [year, handleNavigate, handleGoBack, aiGeneratedHtml]); // Add aiGeneratedHtml to dependencies

  // Add effect to stop sounds when window is closed
  useEffect(() => {
    if (!isWindowOpen) {
      if (stopElevatorMusic) {
        stopElevatorMusic();
      }
      // Also stop any ongoing navigation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    }
  }, [isWindowOpen, stopElevatorMusic]);

  // --- Remove Effect to persist navigation state --- 
  // useEffect(() => {
  //   if (status === 'success' && url && year) {
  //     updateBrowserState(); // Moved to loadSuccess action
  //   }
  // }, [status, url, year, updateBrowserState]);

  // Effect to check for scrollable favorites (Keep this, depends on DOM)
  useEffect(() => {
    const checkScroll = () => {
      const container = favoritesContainerRef.current;
      if (container) {
        const hasMore = container.scrollWidth > container.clientWidth &&
          container.scrollLeft < container.scrollWidth - container.clientWidth - 1; // Add tolerance
        setHasMoreToScroll(hasMore);
      }
    };
    const container = favoritesContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(container);
      checkScroll(); // Initial check
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScroll);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [favorites]); // Re-run when favorites change (or on mount)

  // Effect for horizontal mouse wheel scrolling on favorites bar
  useEffect(() => {
    const container = favoritesContainerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (!container) return;
      // Check if there's significant vertical scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault(); // Prevent default vertical page scroll
        container.scrollLeft += e.deltaY;
      } 
      // Allow default horizontal scroll if deltaX is greater (e.g., trackpad swipe)
    };

    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false }); // Need passive: false to preventDefault
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []); // Run only once on mount

  // --- Remove Effect to sync error state --- 
  // useEffect(() => {
  //   if (error && !errorDetails) { ... } // Handled by store actions
  // }, [error, errorDetails, setErrorAndStopLoading, clearErrorDetails]);

  // Add a function to get debug status message
  const getDebugStatusMessage = () => {
    // Only show a message when something is loading/happening
    if (!(status === "loading" || isAiLoading || isFetchingWebsiteContent)) return null;

    const hostname = url ? getHostnameFromUrl(url) : "unknown";
    const aiModel = useAppStore.getState().aiModel;
    const modelInfo = aiModel ? `${aiModel} ` : '';
    
    // Check if we're fetching website content
    if (isFetchingWebsiteContent) {
      return (
        <div className="flex items-center gap-1">
          {debugMode && <span className="text-gray-500">Fetch</span>}
          <span>{`Fetching content of ${hostname} for reconstruction...`}</span>
        </div>
      );
    }
    
    switch (mode) {
      case "future":
        return (
          <div className="flex items-center gap-1">
            {debugMode && <span className="text-gray-500">{modelInfo}</span>}
            <span>{`Reimagining ${hostname} for year ${year}...`}</span>
          </div>
        );
      case "past":
        if (parseInt(year) <= 1995) {
          return (
            <div className="flex items-center gap-1">
              {debugMode && <span className="text-gray-500">{modelInfo}</span>}
              <span>{`Reconstructing history of ${hostname} for year ${year}...`}</span>
            </div>
          );
        }
        return `Fetching ${hostname} from year ${year}...`;
      case "now":
        return `Loading ${hostname}...`;
      default:
        return `Loading ${hostname}...`;
    }
  };

  if (!isWindowOpen) return null;

  // Use store state for loading status
  const isLoading = status === "loading" || isAiLoading || isFetchingWebsiteContent;
  const isFutureYear = mode === "future"; // Use mode from store

  // Loading bar variants (keep)
  const loadingBarVariants = {
    hidden: { 
      height: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    },
    visible: { 
      height: "0.25rem", // equivalent to h-1
      opacity: 1,
      transition: { duration: 0.3 }
    },
  };

  // Render error page based on store's errorDetails
  const renderErrorPage = () => {
    // Use errorDetails directly from store
    if (!errorDetails) return null;

    // const errorUrl = errorDetails.targetUrl || url; // errorUrl is unused
    // Hostname should be available within errorDetails from handleNavigationError
    const errorHostname = errorDetails.hostname || "the website";

    const commonSuggestions: ReactNode[] = [
      "Try time traveling to a different year",
      // Use ReactNode for inline button rendering
      <>Go <a href="#" role="button" onClick={(e) => { e.preventDefault(); handleGoBack(); }} className="text-red-600 underline">Back</a> or change the URL to visit a different website</>,
    ];
    
    const refreshSuggestion: ReactNode = 
        <>Click the <a href="#" role="button" onClick={(e) => { e.preventDefault(); handleRefresh(); }} className="text-red-600 underline">Refresh</a> link to try again</>;

    switch (errorDetails.type) {
      case "http_error":
        return (
          <ErrorPage
            title="The page cannot be displayed"
            primaryMessage="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
            suggestions={[
              "If you typed the page address in the Address bar, make sure that it is spelled correctly.",
              // Use ReactNode for hostname link
              <>Open <a href={`https://${errorHostname}`} target="_blank" rel="noopener noreferrer" className="text-red-600 underline">{errorHostname}</a> in a new tab, and then look for links to the information you want.</>,
              // Use ReactNode for back button
              <>Go <a href="#" role="button" onClick={(e) => { e.preventDefault(); handleGoBack(); }} className="text-red-600 underline">Back</a> or change the URL to try another page.</>,
            ]}
            details={errorHostname} // Pass hostname directly
            footerText={`HTTP ${errorDetails.status || 404} - ${errorDetails.statusText || "Not Found"}\nInternet Explorer`}
            onGoBack={handleGoBack} // Use wrapper callback
            onRetry={handleRefresh} // Use wrapper callback
          />
        );
      case "connection_error":
        return (
          <ErrorPage
            title="The page cannot be displayed"
            primaryMessage={errorDetails.message || "Internet Explorer cannot access this website."}
            suggestions={[
              refreshSuggestion,
              ...commonSuggestions
            ]}
            details={errorDetails.details || "Connection failed"}
            footerText={`Connection Error\nInternet Explorer`}
            onGoBack={handleGoBack}
            onRetry={handleRefresh}
          />
        );
      // Add case for ai_generation_error if generateFuturisticWebsite calls handleNavigationError
      case "ai_generation_error":
         return (
          <ErrorPage
            title="The page cannot be imagined"
            primaryMessage={errorDetails.message}
            suggestions={[
              refreshSuggestion,
              ...commonSuggestions
            ]}
            details={errorDetails.details}
            footerText={`Time Machine Error\nInternet Explorer`}
            onGoBack={handleGoBack}
            onRetry={handleRefresh}
          />
        );
      default: // Includes navigation_error, generic_error
        return (
          <ErrorPage
            title="An error occurred"
            primaryMessage={errorDetails.message}
            suggestions={[
               refreshSuggestion,
              ...commonSuggestions
            ]}
            details={errorDetails.details}
            footerText={`Error\nInternet Explorer`}
            onGoBack={handleGoBack}
            onRetry={handleRefresh}
          />
        );
    }
  };

  return (
    <>
      <InternetExplorerMenuBar
        // Pass state/actions from store
        isWindowOpen={isWindowOpen}
        isForeground={isForeground}
        onRefresh={handleRefresh}
        onStop={handleStop}
        onFocusUrlInput={handleGoToUrl}
        onHome={handleHome}
        onShowHelp={() => setHelpDialogOpen(true)} // Use store action
        onShowAbout={() => setAboutDialogOpen(true)} // Use store action
        isLoading={isLoading}
        favorites={favorites} // From store
        history={history} // From store
        onAddFavorite={handleAddFavorite}
        onClearFavorites={() => setClearFavoritesDialogOpen(true)} // Use store action
        onResetFavorites={() => setResetFavoritesDialogOpen(true)} // Use store action
        onNavigateToFavorite={(favUrl, favYear) => handleNavigateWithHistory(favUrl, favYear)}
        onNavigateToHistory={handleNavigateWithHistory}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        canGoBack={historyIndex < history.length - 1} // Use store state
        canGoForward={historyIndex > 0} // Use store state
        onClearHistory={() => setClearHistoryDialogOpen(true)} // Use store action
        onClose={onClose}
        onEditFuture={() => setFutureSettingsDialogOpen(true)} // Use store action
      />
      <WindowFrame
        title={displayTitle}
        onClose={onClose}
        isForeground={isForeground}
        appId="internet-explorer"
      >
        <div className="flex flex-col h-full w-full relative">
          {/* Toolbar uses store state/actions via props or direct calls */}
          <div className="flex flex-col gap-1 p-1 bg-gray-100 border-b border-black">
             {/* ... (Toolbar UI remains largely the same, button disabled state uses store historyIndex) ... */}
            <div className="flex gap-2 items-center">
               <div className="flex gap-1">
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={handleGoBack}
                   disabled={historyIndex >= history.length - 1} // Use store state
                   className="h-8 w-8"
                 >
                   <ArrowLeft className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={handleGoForward}
                   disabled={historyIndex <= 0} // Use store state
                   className="h-8 w-8"
                 >
                   <ArrowRight className="h-4 w-4" />
                 </Button>
               </div>
               <Input
                 ref={urlInputRef}
                 value={url} // Use store state
                 onChange={(e) => setUrl(e.target.value)} // Use store action
                 onKeyDown={(e) => {
                   if (e.key === "Enter") {
                     handleNavigate(); // Uses store state implicitly
                   }
                 }}
                 className="flex-1"
                 placeholder="Enter URL"
               />
               <div className="flex items-center gap-2">
                 <Select
                   value={year} // Use store state
                   onValueChange={(newYear) => handleNavigate(url, newYear)} // Use store state for url
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Year" />
                   </SelectTrigger>
                   <SelectContent>
                     {/* Year options logic remains the same */} 
                     {futureYears.map((y) => (
                       <SelectItem key={y} value={y} className="text-blue-600">{y}</SelectItem>
                     ))}
                     <SelectItem value="current">Now</SelectItem>
                     {pastYears.map((y) => (
                       <SelectItem key={y} value={y} className={parseInt(y) <= 1995 ? "text-blue-600" : ""}>{y}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
             {/* Favorites bar uses store state */}
            <div className="relative flex items-center">
               {/* Add scroll buttons if needed later, for now just the container */}
              <div
                ref={favoritesContainerRef}
                className="overflow-x-auto scrollbar-none relative flex-1"
              >
                <div className="flex items-center min-w-full w-max">
                  {favorites.map((favorite, index) => ( // Use store state
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="whitespace-nowrap hover:bg-gray-200 font-geneva-12 text-[10px] gap-1 px-1 mr-1 w-content min-w-[60px] max-w-[120px] flex-shrink-0"
                      onClick={(e) => {
                        handleNavigateWithHistory(favorite.url, favorite.year);
                        // Scroll the clicked button into view within its container
                        e.currentTarget.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'nearest', 
                          inline: 'nearest' 
                        });
                      }}
                    >
                      <img
                        src={favorite.favicon || "/icons/ie-site.png"}
                        alt="Site"
                        className="w-4 h-4 mr-1"
                        onError={(e) => { e.currentTarget.src = "/icons/ie-site.png"; }}
                      />
                      <span className="truncate">{favorite.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {/* Use component state for scroll indicator */}
              {favorites.length > 0 && hasMoreToScroll && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none" />
              )}
            </div>
          </div>

          {/* Content Area uses store state */}
          <div className="flex-1 relative">
            {errorDetails ? (
              renderErrorPage() // Uses store state
            ) : isFutureYear || (mode === "past" && (isAiLoading || aiGeneratedHtml)) ? (
              <div className="w-full h-full overflow-hidden absolute inset-0 font-geneva-12">
                <HtmlPreview
                  htmlContent={isAiLoading ? generatedHtml || "" : aiGeneratedHtml || ""} // Use store/hook state
                  onInteractionChange={() => {}}
                  className="border-none"
                  maxHeight="none"
                  minHeight="100%"
                  initialFullScreen={false}
                  isInternetExplorer={true}
                  // Only use streaming mode when actively generating new content
                  isStreaming={isAiLoading && generatedHtml !== aiGeneratedHtml}
                  playElevatorMusic={playElevatorMusic}
                  stopElevatorMusic={stopElevatorMusic}
                  playDingSound={playDingSound}
                  baseUrlForAiContent={url} // Pass the original URL as base
                  mode={mode} // Pass the mode from store state
                />
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={finalUrl || ""} // Use store state
                className="w-full h-full border-0"
                onLoad={handleIframeLoad} // Uses store actions
                onError={handleIframeError} // Uses store actions
              />
            )}

            {/* Add foreground overlay */}
            {!isForeground && (
              <div 
                className="absolute inset-0 bg-transparent z-50"
                onClick={() => bringToForeground("internet-explorer")}
                onMouseDown={() => bringToForeground("internet-explorer")}
                onTouchStart={() => bringToForeground("internet-explorer")}
                onWheel={() => bringToForeground("internet-explorer")}
                onDragStart={() => bringToForeground("internet-explorer")}
                onKeyDown={() => bringToForeground("internet-explorer")}
              />
            )}

            {/* Loading Bar uses store status */}
            <AnimatePresence>
              {(status === "loading" || (isAiLoading && generatedHtml !== aiGeneratedHtml) || isFetchingWebsiteContent) && (
                <motion.div
                  className="absolute top-0 left-0 right-0 bg-white/75 backdrop-blur-sm overflow-hidden z-50"
                  variants={loadingBarVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className={`h-full ${
                    isAiLoading && mode === "past" && parseInt(year) <= 1995 ? 'animate-progress-indeterminate-purple-reverse' :
                    isAiLoading ? 'animate-progress-indeterminate-purple' : 
                    isFetchingWebsiteContent && mode === "past" ? 'animate-progress-indeterminate-green-reverse' :
                    isFetchingWebsiteContent ? 'animate-progress-indeterminate-green' : 
                    mode === "past" && !isAiLoading ? 'animate-progress-indeterminate-reverse' : 
                    'animate-progress-indeterminate'
                  }`} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add debug status bar at bottom */}
          <AnimatePresence>
            { (status === "loading" || (isAiLoading && generatedHtml !== aiGeneratedHtml) || isFetchingWebsiteContent) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-0 left-0 right-0 bg-gray-100 border-t border-black font-geneva-12 text-[10px] px-2 py-1 flex items-center z-50"
              >
                <div className="flex-1 truncate">
                  {getDebugStatusMessage()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Dialogs use store state and actions */}
        <InputDialog
          isOpen={isTitleDialogOpen} // Use store state
          onOpenChange={setTitleDialogOpen} // Use store action
          onSubmit={handleTitleSubmit}
          title="Add Favorite"
          description="Enter a title for this favorite"
          value={newFavoriteTitle} // Use store state
          onChange={setNewFavoriteTitle} // Use store action
        />
        <HelpDialog
          isOpen={isHelpDialogOpen} // Use store state
          onOpenChange={setHelpDialogOpen} // Use store action
          helpItems={helpItems}
          appName="Internet Explorer"
        />
        <AboutDialog
          isOpen={isAboutDialogOpen} // Use store state
          onOpenChange={setAboutDialogOpen} // Use store action
          metadata={appMetadata}
        />
        <ConfirmDialog
          isOpen={isClearFavoritesDialogOpen} // Use store state
          onOpenChange={setClearFavoritesDialogOpen} // Use store action
          onConfirm={handleClearFavorites}
          title="Clear Favorites"
          description="Are you sure you want to clear all favorites?"
        />
        <ConfirmDialog
          isOpen={isClearHistoryDialogOpen} // Use store state
          onOpenChange={setClearHistoryDialogOpen} // Use store action
          onConfirm={() => { // Use store action and also close dialog
            clearHistory();
            setClearHistoryDialogOpen(false);
          }}
          title="Clear History"
          description="Are you sure you want to clear all history?"
        />
        <ConfirmDialog
          isOpen={isResetFavoritesDialogOpen} // Use store state
          onOpenChange={setResetFavoritesDialogOpen} // Use store action
          onConfirm={handleResetFavorites} // Uses store actions
          title="Reset Favorites"
          description="Are you sure you want to reset favorites to default?"
        />
        <FutureSettingsDialog
          isOpen={isFutureSettingsDialogOpen} // Use store state
          onOpenChange={setFutureSettingsDialogOpen} // Use store action
        />
      </WindowFrame>
    </>
  );
}
