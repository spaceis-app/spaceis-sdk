// Allow side-effect CSS imports (`import "@/styles.css"`) without TS complaining.
// Next.js injects this via its own types but on TS 6 + fresh checkout the ambient
// module sometimes isn't resolved before `.next/` is generated.
declare module "*.css";
