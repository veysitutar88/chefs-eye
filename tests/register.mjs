// In-process TS/TSX loader: no esbuild executable or test-worker spawn required.
// Node >=22.15. Uses the existing TypeScript dependency; performs no type checking.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      const candidates = /\.js$/.test(url.pathname)
        ? [url.href.replace(/\.js$/, '.ts'), url.href.replace(/\.js$/, '.tsx')]
        : !/\.[a-z]+$/i.test(url.pathname) ? [url.href + '.ts', url.href + '.tsx'] : [];
      for (const candidate of candidates) if (existsSync(new URL(candidate))) return { url: candidate, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.tsx?$/.test(url)) return { format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        fileName: new URL(url).pathname,
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    return nextLoad(url, context);
  },
});
