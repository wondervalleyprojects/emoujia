// Mounts Emoujia inside a page someone else owns. The host gives one element:
//
//   <div data-emoujia
//        data-api="/lab/emoujia/api"           where the API lives (required)
//        data-css="/lab/emoujia/embed.css"     the embed's stylesheet (required)
//        data-build-href="/lab/build/"         optional: "Build with the Lab"
//        data-build-label="Build with the Lab"></div>
//   <script src="/lab/emoujia/embed.js" defer></script>
//
// Everything renders inside the element's shadow root, so no style leaks out
// and the host's styles cannot break it. The host's --pw-* tokens and fonts
// pass through. With scripts off the element stays empty and the host page's
// own words stand. Full contract: docs/INTEGRATION.md.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Experience from './Experience';


export function mount(host: HTMLElement) {
  if (host.shadowRoot) return; // already mounted
  const { api, css, buildHref, buildLabel } = host.dataset;
  if (!api || !css) { console.error('[emoujia] The mount needs data-api and data-css. See docs/INTEGRATION.md.'); return; }

  const shadow = host.attachShadow({ mode: 'open' });
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = css;
  const root = document.createElement('div');
  root.className = 'emoujia';
  root.hidden = true; // until the stylesheet arrives, so nothing flashes unstyled
  const show = () => { root.hidden = false; };
  link.addEventListener('load', show); link.addEventListener('error', show);
  shadow.append(link, root);

  createRoot(root).render(
    <StrictMode>
      <Experience api={api.replace(/\/+$/, '')} host={host} buildHref={buildHref} buildLabel={buildLabel} fallback={__EMOUJIA_FALLBACK__} />
    </StrictMode>,
  );
}

function start() { document.querySelectorAll<HTMLElement>('[data-emoujia]').forEach(mount); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
