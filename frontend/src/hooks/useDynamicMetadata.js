import { useEffect } from 'react';

const EMOJIS = ['🚀', '💼', '🎯', '⚡', '✨', '🔥', '💻', '📈'];
const BASE_TITLE = 'TrackHire';

export default function useDynamicMetadata() {
    useEffect(() => {
        let index = 0;
        let intervalId;

        const updateMetaTags = (newTitle) => {
            // Update og:title
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', newTitle);

            // Update twitter:title
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle) twitterTitle.setAttribute('content', newTitle);
        };

        const startCycle = () => {
            if (intervalId) clearInterval(intervalId);
            
            // Set initial state
            const initialTitle = `${BASE_TITLE} ${EMOJIS[index]}`;
            document.title = initialTitle;
            updateMetaTags(initialTitle);

            intervalId = setInterval(() => {
                index = (index + 1) % EMOJIS.length;
                const nextTitle = `${BASE_TITLE} ${EMOJIS[index]}`;
                document.title = nextTitle;
                updateMetaTags(nextTitle);
            }, 2500);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab is inactive - show a funky, friendly call back message
                if (intervalId) clearInterval(intervalId);
                const inactiveTitle = `Come back! 🥺 ${BASE_TITLE}`;
                document.title = inactiveTitle;
                updateMetaTags(inactiveTitle);
            } else {
                // Tab is active again - resume the cycle
                startCycle();
            }
        };

        // Start cycling initially
        startCycle();

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalId) clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.title = "TrackHire - Track Every Job. Miss No Opportunity.";
        };
    }, []);
}
