# Cloudflare Pages Deployment

Deployment is a user-authorized final step. The autonomous loop must not deploy by itself.

## Expected build

```text
Build command: npm run build
Build output directory: dist
```

No runtime environment variables or backend functions are required for the first release.

## Git integration

After the user reviews the project and explicitly authorizes pushing:

1. Push the repository to the chosen Git provider.
2. In Cloudflare Workers & Pages, create a Pages application from the repository.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy a preview first.
6. Verify loading, input, audio unlock, localStorage, and responsive scaling on the preview URL.
7. Promote or use the production branch only after review.

## Static-route behavior

Prefer a single-page app that does not require path-based routes. If client routes are later added, configure an appropriate Pages fallback and test direct navigation.
