import globalJsdom from "global-jsdom";

/**
 * Gives a test file a browser: a document, window and the DOM classes React and Testing Library use.
 * Import it first, before React or any component. Components read the page address, so it is the
 * app's own.
 */
globalJsdom("<!doctype html><html><body></body></html>", { url: "http://localhost:3006/" });

// React only reports state updates made outside act() when it is told it is under test.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Node's own FormData refuses a jsdom form, and React builds a Server Action's FormData from the form that was
// submitted. A test that submits a form gets the browser's FormData, the way the app does.
globalThis.FormData = window.FormData as unknown as typeof FormData;
