// emoujia.com: mounts the experience (the same code the studio site embeds)
// and runs the page's own light switch. The page is plain HTML in index.html.
import './standalone.css';
import './embed';

type Light = 'auto' | 'day' | 'night';
const KEY = 'emoujia-light'; // a display preference, kept on this device only

function apply(light: Light) {
  const root = document.documentElement;
  if (light === 'auto') { root.removeAttribute('data-light'); localStorage.removeItem(KEY); }
  else { root.setAttribute('data-light', light); localStorage.setItem(KEY, light); }
  document.querySelectorAll<HTMLButtonElement>('[data-light-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lightChoice === light)));
}

const saved = (localStorage.getItem(KEY) as Light) || 'auto';
apply(saved);
document.querySelectorAll<HTMLButtonElement>('[data-light-choice]').forEach((b) => {
  b.hidden = false;
  b.addEventListener('click', () => apply(b.dataset.lightChoice as Light));
});

// The footer's Privacy link points at the notice, which lives in the mount.
function toNotice(e?: Event) {
  const el = document.querySelector<HTMLElement>('[data-emoujia]')?.shadowRoot?.getElementById('privacy');
  if (!el) return;
  e?.preventDefault();
  el.scrollIntoView({ block: 'center' });
}
document.querySelector('a[href="#privacy"]')?.addEventListener('click', toNotice);
if (location.hash === '#privacy') requestAnimationFrame(() => toNotice());
