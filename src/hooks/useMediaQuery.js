
import { useState, useEffect } from 'react';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);

    // Prior to Safari 14, MediaQueryList didn't inherit from EventTarget
    try {
        mediaQueryList.addEventListener('change', documentChangeHandler);
    } catch (e) {
        // Fallback for older browsers
        mediaQueryList.addListener(documentChangeHandler);
    }

    // Cleanup on unmount
    return () => {
        try {
            mediaQueryList.removeEventListener('change', documentChangeHandler);
        } catch (e) {
            // Fallback for older browsers
            mediaQueryList.removeListener(documentChangeHandler);
        }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;
