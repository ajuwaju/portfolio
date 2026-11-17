# Allanah's writing portfolio

A static site: `index.html` plus `paper3d.js` (the 3D paper stack, built with react-three-fiber).
No build step is needed to deploy. Vercel serves it as-is.

`src/` holds the source of `paper3d.js`. To rebuild it after changes:

    npm i react@18.3.1 react-dom@18.3.1 three@0.169.0 @react-three/fiber@8.17.10 esbuild
    npx esbuild src/entry.js --bundle --minify --format=iife --jsx=automatic \
      --define:process.env.NODE_ENV='"production"' --legal-comments=none --outfile=paper3d.js
