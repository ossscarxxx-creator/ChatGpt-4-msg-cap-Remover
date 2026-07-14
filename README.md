# Random Joke Generator

This is a simple static Random Joke Generator that fetches jokes from external APIs and displays them in the browser.

Files added:

- `index.html` — UI with a button to fetch a joke and a selector to choose the API.
- `styles.css` — Minimal styling for the page.
- `js/joke.js` — JavaScript that calls the external joke APIs and updates the page.

How to use

1. Open `index.html` in your browser. For best results, serve the folder via a local static server (e.g., `npx http-server` or `python -m http.server`) and visit `http://localhost:8080`.
2. Click "Get a joke". Choose between:
   - `icanhazdadjoke` (https://icanhazdadjoke.com/) — returns a single dad joke in JSON when the Accept header is `application/json`.
   - `Official Joke API` (https://official-joke-api.appspot.com/) — returns jokes with `setup` and `punchline`.

Notes

- Both APIs support CORS and should work from the browser. If you encounter CORS errors, try using a server-side proxy or run from a local static server.
- This is intentionally small and dependency-free; feel free to integrate into your project or expand it (add caching, favorites, sharing, server-side fetching, etc.).

License

Feel free to use and modify.
