import React, { useEffect, useState } from 'react';

type Light = 'auto' | 'day' | 'night';
const KEY = 'emoujia-light'; // a display preference, kept on this device only

function apply(light: Light) {
  const root = document.documentElement;
  if (light === 'auto') root.removeAttribute('data-light'); else root.setAttribute('data-light', light);
}

export default function Footer() {
  const [light, setLight] = useState<Light>(() => (localStorage.getItem(KEY) as Light) || 'auto');
  useEffect(() => { apply(light); if (light === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, light); }, [light]);
  const choose = (l: Light) => (e: React.MouseEvent) => { e.preventDefault(); setLight(l); };

  return (
    <footer className="site-footer">
      <a href="https://wondervalleyprojects.com" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <img src="/wvp-bug.svg" width={40} height={40} alt="" />
        <span className="label" style={{ color: 'var(--pw-role-text)' }}>A Wonder Valley Projects Lab</span>
      </a>
      <div className="links">
        <a href="https://wondervalleyprojects.com">About</a>
        <a href="mailto:emoujia@wondervalleyprojects.com?subject=Remove%20me&body=Please%20remove%20this%20email%20address%20from%20Emoujia.">Remove me</a>
        <a href="/#privacy">Privacy</a>
        <span className="light" aria-label="Light">
          {(['auto', 'day', 'night'] as Light[]).map((l, i) => (
            <span key={l}>{i > 0 && ' '}<a href="#" aria-current={light === l} onClick={choose(l)} style={{ marginRight: 12 }}>{l[0].toUpperCase() + l.slice(1)}</a></span>
          ))}
        </span>
      </div>
    </footer>
  );
}
