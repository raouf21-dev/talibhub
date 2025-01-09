// humanBehaviorUtils.js
const humanBehavior = {
    async randomDelay(min = 100, max = 300) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    },

    async simulateScroll(page) {
        await page.evaluate(async () => {
            const height = document.documentElement.scrollHeight;
            const duration = Math.floor(Math.random() * (800 - 500) + 500);
            const scrollStep = Math.floor(height / 4);
            
            for (let i = 0; i < height; i += scrollStep) {
                window.scrollTo(0, i);
                await new Promise(resolve => setTimeout(resolve, duration / 4));
            }
        });
    },

    async moveMouseRandomly(page, selector) {
        try {
            const element = await page.$(selector);
            if (!element) return;

            const box = await element.boundingBox();
            if (!box) return;

            // Points de contrôle pour une courbe de Bézier
            const points = [
                { x: Math.random() * box.width + box.x, y: Math.random() * box.height + box.y },
                { x: Math.random() * box.width + box.x, y: Math.random() * box.height + box.y }
            ];

            await page.mouse.move(points[0].x, points[0].y, { steps: 5 });
            await page.mouse.move(points[1].x, points[1].y, { steps: 5 });
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });

        } catch (error) {
            // Silently fail to not impact scraping performance
            console.debug('Mouse movement simulation skipped');
        }
    },

    async setupPageOptimized(page) {
        await page.evaluateOnNewDocument(() => {
            // Masquer les traces de Puppeteer/Automation
            delete Object.getPrototypeOf(navigator).webdriver;
            
            // Simuler un vrai navigateur
            const newProto = navigator.__proto__;
            newProto.webdriver = false;
            navigator.__proto__ = newProto;

            // Simuler des plugins communs
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    {
                        0: {type: "application/x-google-chrome-pdf"},
                        description: "Portable Document Format",
                        suffixes: "pdf",
                        type: "application/x-google-chrome-pdf",
                        filename: "internal-pdf-viewer"
                    }
                ]
            });

            // Simuler une langue et une plateforme
            Object.defineProperty(navigator, 'language', { get: () => "en-US" });
            Object.defineProperty(navigator, 'platform', { get: () => "Win32" });

            // Simuler un historique de navigation
            window.history.length = Math.floor(Math.random() * 3) + 2;

            // Masquer la chaîne d'utilisateur WebGL
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) return 'Intel Inc.';
                if (parameter === 37446) return 'Intel Iris OpenGL Engine';
                return getParameter.apply(this, [parameter]);
            };
        });
    }
};

module.exports = humanBehavior;