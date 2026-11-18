# HwangT — Galaxy Portfolio

A personal portfolio with an interactive galaxy of public GitHub projects, animated spiral stars, comets, and a GitHub-powered profile.

- **Portfolio:** https://hoangtung108.github.io/HoangTung108/
- **GitHub profile:** https://github.com/HoangTung108
- **Public profile repository:** https://github.com/HoangTung108/HoangTung108

## Local development

```sh
npm ci
npm run dev
```

## Production build

```sh
npm run build
```

The `dist/` directory contains the static website. Relative asset paths support GitHub Pages project URLs. The public profile repository serves the built files from `main:/docs`; its root `README.md` appears on the GitHub profile.

To publish an update, build this project, replace the public profile repository's `docs/` contents with `dist/`, keep `docs/.nojekyll`, and commit/push that repository. Pushing this source repository alone does not update the published website.

Built with React, Vite, Three.js, React Three Fiber, Tailwind CSS, and Framer Motion. Language bars show repository usage, not self-assessed proficiency.
