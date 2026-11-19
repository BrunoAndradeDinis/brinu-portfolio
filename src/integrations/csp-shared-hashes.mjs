import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const META = /(<meta http-equiv="content-security-policy" content=")([^"]+)(")/;
const HASHED_DIRECTIVES = ['script-src', 'style-src'];

async function htmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(full);
      return entry.name.endsWith('.html') ? [full] : [];
    }),
  );
  return nested.flat();
}

function split(csp) {
  return csp
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(/\s+/));
}

/** ClientRouter keeps the first document's CSP across soft navigations, so every page must allow every page's hashes. */
export default function cspSharedHashes() {
  return {
    name: 'csp-shared-hashes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await htmlFiles(fileURLToPath(dir));
        const pages = await Promise.all(files.map(async (file) => ({ file, html: await fs.readFile(file, 'utf8') })));
        const union = Object.fromEntries(HASHED_DIRECTIVES.map((name) => [name, new Set()]));

        for (const { html } of pages) {
          const match = html.match(META);
          if (!match) continue;
          for (const [name, ...sources] of split(match[2])) {
            if (union[name]) sources.filter((source) => source.startsWith("'sha")).forEach((source) => union[name].add(source));
          }
        }

        await Promise.all(
          pages.map(({ file, html }) => {
            const next = html.replace(META, (_, open, csp, close) => {
              const merged = split(csp).map(([name, ...sources]) =>
                union[name] ? [name, ...sources.filter((source) => !source.startsWith("'sha")), ...union[name]] : [name, ...sources],
              );
              return open + merged.map((parts) => parts.join(' ')).join('; ') + ';' + close;
            });
            return next === html ? null : fs.writeFile(file, next);
          }),
        );
        logger.info(`shared ${union['script-src'].size} script and ${union['style-src'].size} style hashes across ${pages.length} pages`);
      },
    },
  };
}
