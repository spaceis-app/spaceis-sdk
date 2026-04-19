// Ambient declaration for process.env.NODE_ENV.
// This allows tree-shakable dev-only guards without requiring @types/node.
// Bundlers (Next.js, Vite, webpack) replace process.env.NODE_ENV statically.
declare const process: {
  readonly env: {
    readonly NODE_ENV: string;
  };
};
