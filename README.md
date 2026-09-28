# Mira Voss — Interactive Portfolio

A responsive portfolio page enhanced with plain JavaScript. It is the interactive follow-up to the responsive-design exercise and uses no libraries or build tools.

## Files

```
.
├── index.html                    # Markup and interactive hooks (data-*, aria-*)
├── styles.css                    # Styling, including every state JavaScript toggles
├── script.js                     # All behaviour (8 features, no dependencies)
├── img/                          # Generated images, each in 2–3 sizes
├── docs/
│   ├── technical-document.md     # Implementation, choices, challenges, tests
│   └── screenshots/              # Interactive states used in the document
└── README.md
```

## Run it

Keep the files together and open `index.html` in a browser (Chrome, Firefox, Safari or Edge). To use a local server instead, run `python3 -m http.server 8000` in this folder and visit http://localhost:8000, or use the VS Code "Live Server" extension.

Web fonts load from Google Fonts, so they need an internet connection; without one the page uses system fonts and works the same.

## Interactive features

- **Mobile menu:** accessible toggle that closes on link click, Escape, outside click or resize.
- **Active-section link:** the nav highlights the section you are reading.
- **Gallery filter:** All / Warm / Cool / Neutral, with counts and a screen-reader announcement.
- **Lightbox:** click a study to view it large. Arrow keys, on-screen arrows and swipe navigate; Escape or a backdrop click closes it, and focus returns to where you were.
- **Scroll reveal and stat counters:** content fades in and numbers count up as they appear.
- **Contact form validation:** inline errors on blur and live correction, a character counter, and a placeholder that changes with the enquiry type. Submission is simulated because there is no backend.
- **Back-to-top button:** appears after the hero scrolls out of view.

## Works without JavaScript

Content is never hidden if the script does not run: the filter controls stay hidden, the nav stays usable, and gallery images link straight to the large file. Users who prefer reduced motion see all content immediately with no animation.

## Testing

60 automated checks (Playwright, Chromium 141) cover every feature, the no-JavaScript and reduced-motion cases, and console errors. Swipe was checked with synthetic touch events. Testing on physical iOS and Android devices has not been done.

See [`docs/technical-document.md`](docs/technical-document.md) for the full explanation.
