export default function Header() {
  return (
    <header className="site-header">
      <a className="name" href="https://wondervalleyprojects.com">
        <img src="/wvp-bug.svg" width={40} height={40} alt="" />
        <span>Wonder Valley Projects</span>
      </a>
      <nav aria-label="Where you are">Lab</nav>
    </header>
  );
}
