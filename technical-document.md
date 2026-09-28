# Technical Document — Interactive Portfolio (Plain JavaScript)

**Files:** `index.html` (264 lines), `styles.css` (461), `script.js` (420), plus `img/`.
**Stack:** HTML, CSS and vanilla JavaScript (ES2015+). No libraries, no build step.
**Base:** the responsive Mira Voss portfolio from the previous exercise, enhanced with behaviour.

## 1. Plan: what to make interactive, and why

I reviewed the static page for places where interaction would help a visitor, and gave each feature one objective so it could be tested against it.

| # | Feature | Objective | Main techniques |
|---|---|---|---|
| 1 | Mobile menu | Replace the checkbox trick with a menu that reports its state to assistive tech and closes itself sensibly | `aria-expanded`, class toggle, `matchMedia`, keyboard and outside-click handling |
| 2 | Active-section link | Show the reader where they are on a one-page site | `IntersectionObserver`, `aria-current` |
| 3 | Gallery filter | Let visitors narrow six studies to a tone (warm / cool / neutral) | Event delegation, `data-*` attributes, `hidden`, live region |
| 4 | Lightbox | View a study large, with keyboard, swipe and wrap-around navigation | Native `<dialog>`, `showModal()`, dynamic content updates, touch events |
| 5 | Scroll reveal | Content fades up as it enters the viewport | `IntersectionObserver`, CSS transitions, staggered delay via a CSS variable |
| 6 | Stat counters | Animate 0 → value when the numbers appear | `requestAnimationFrame`, easing |
| 7 | Contact form validation | Clear, accessible, inline feedback before submitting | Custom validation rules, `aria-invalid`, `aria-describedby`, focus management |
| 8 | Back-to-top | Return to the top after a long scroll | `IntersectionObserver` on the hero |

## 2. Code structure

`script.js` is one IIFE in strict mode. Each feature is a separate `init…()` function that first checks its elements exist, so removing a piece of markup never throws an error. A single line at the bottom starts them all.

```
script.js
├── helpers            $, $$, reduceMotion, hasObserver
├── initNav()          menu open/close logic
├── initActiveLink()   aria-current from scroll position
├── initFilter()       reveals buttons, filters items, announces result
├── initLightbox()     open / show / prev / next / close, swipe, focus return
├── initReveal()       fade-up on scroll
├── initCounters()     number count-up
├── initForm()         rules → validate() → submit flow
├── initBackToTop()
└── boot               [init…].forEach(run)
```

The HTML declares every interactive element and its hooks (`data-filter`, `data-tone`, `data-reveal`, `data-count`, `aria-*`). The CSS owns every visual state (`.is-open`, `.is-visible`, `.has-error`, `[aria-pressed="true"]`, `[aria-current="true"]`). JavaScript only switches attributes and classes; it never sets colours or sizes, so the three layers stay separate and the layout is not disturbed.

## 3. Key implementation choices

**Progressive enhancement.** The page must work if the script fails to load.
- An inline one-liner in `<head>` adds `class="js"` to `<html>` before first paint. CSS hides reveal-on-scroll content only under `.js`, so nothing is ever stranded invisible.
- Filter buttons ship with the `hidden` attribute and are shown by JavaScript, so there are no dead controls without it.
- Gallery images are real links to the large file. Without JavaScript they open the image; with it, the click is intercepted (`preventDefault`) and opens the lightbox.
- Stat numbers are already correct in the HTML; JavaScript resets them to 0 only when it is about to animate them.

**Native `<dialog>` for the lightbox.** `showModal()` traps focus, makes the page behind inert, and closes on Escape with no extra code. That removes the most error-prone parts of a hand-built modal. I added what it does not provide: arrow-key navigation, backdrop-click close (a backdrop click targets the dialog element itself), returning focus to the thumbnail that opened it, and a scroll lock.

**`IntersectionObserver` instead of scroll listeners** for reveal, counters, active link and back-to-top. The browser reports visibility changes, so there is no per-scroll-event work. Reveal and counters call `unobserve()` after firing once.

**Event delegation.** One click listener on the gallery and one on the filter group serve all their children, rather than one listener per item.

**Accessibility built in, not added after.**
- Filter buttons are a labelled group using `aria-pressed`; results are announced through a `role="status"` live region ("Showing 3 of 6 studies: warm tones.").
- Form errors are linked with `aria-describedby`, inputs get `aria-invalid`, and focus moves to the first invalid field on submit.
- The lightbox caption is a polite live region, so changing image is announced.
- `prefers-reduced-motion` disables reveal, counters, hover zoom and transitions; content is simply shown.
- All controls are real `<button>`s or links, so they work with the keyboard by default.

**Form design.** Errors appear on blur, then update live as the user corrects them, so people are not shown errors before they have finished typing. Messages are plain language. The character counter turns red within 50 characters of the limit. The "I'm writing about" menu updates the message placeholder. Submission is simulated with a 700 ms timeout because there is no backend, and the success message says so. The visitor's name is inserted with `textContent`, never `innerHTML`, so it cannot inject markup.

## 4. Challenges and how they were handled

1. **Filtering vs. scroll reveal.** Items already revealed would just pop back in when a filter changed, with no motion, and items not yet revealed must stay hidden until scrolled to. Solution: on filter, only items that already have `.is-visible` replay their entrance (remove class, force a reflow with `void item.offsetWidth`, re-add class, with a staggered delay). Unrevealed items are left to the observer.
2. **`hidden` beaten by CSS.** Any rule like `.filters { display: flex }` silently overrides the `hidden` attribute. I added a global `[hidden] { display: none !important; }` up front, since several features depend on it.
3. **Scroll lock causing a layout jump.** Hiding page scroll while the lightbox is open removes the scrollbar and shifts the page sideways. Fix: `scrollbar-gutter: stable`. Reviewing my screenshots then showed a light strip at the right edge where the gutter was not covered by the dark backdrop; I tinted the root background while the lightbox is open to match.
4. **Lightbox and filters together.** The viewer builds its list from the *currently visible* items each time it opens, so "1 / 3" and prev/next follow the active filter. With a single visible item, the arrow buttons are hidden.
5. **Menu state after resizing.** If the mobile menu was open and the window widened, `aria-expanded` could go out of sync with the layout. A `matchMedia` listener closes it.
6. **Two failures in my own tests, neither a code bug.** Back-to-top appeared to fail because the smooth scroll takes about 700 ms and my test waited 400 ms. Two overflow checks read `-15`, which means the page was *narrower* than the viewport because of the reserved scrollbar gutter; my condition (`== 0`) was wrong and should have been `<= 0`. I confirmed both by measuring directly before changing the tests.

## 5. Testing

I ran automated checks in Chromium 141 with Playwright and a swipe check with synthetic touch events.

| Area | What was verified |
|---|---|
| Filter | Counts 6 / 3 / 2 / 1; correct number shown for each filter; `aria-pressed` swaps; live-region text |
| Lightbox | Opens with the large image; focus lands on the close button; arrow keys navigate and wrap; Escape closes; focus returns to the thumbnail; scroll lock released; respects filter; arrows hidden for one item; backdrop click closes; swipe left/right works and a tiny movement is ignored |
| Nav (390px) | Opens/closes; closes on link click, Escape (focus returns to toggle), outside click and resize |
| Form | Empty submit shows 3 errors and focuses the name field; bad email and short message messages; errors clear live; counter; placeholder change; button disables during send; success uses first name and resets the form; markup in the name field is rendered as text |
| Scroll | Reveal fires when scrolled to; correct link marked current; counters end at 12 / 31 / 6; back-to-top hidden then shown then returns to 0 |
| Fallbacks | With JavaScript disabled: filters hidden, nav usable, content visible, links go to images, no overflow. With reduced motion: everything visible immediately, counters show final values |
| Errors | No console or page errors on desktop or mobile |

**Result: 60 of 60 checks passed** (after correcting the two test conditions in section 4).

## 6. Limitations and next steps

- The form has no server, so nothing is stored or sent. A real version would `fetch()` to an endpoint and handle failure states.
- Testing was done with browser emulation. Swipe used synthetic touch events, so a real-device check on iOS and Android is still worth doing.
- The nav toggle uses a fixed `max-height` for its slide animation; a much longer menu would need a larger value.
- Lightbox images are not zoomable, and there is no pinch gesture.
- The gallery has six items, so filtering is illustrative; with dozens of items it would want a URL hash so a filter can be shared.
