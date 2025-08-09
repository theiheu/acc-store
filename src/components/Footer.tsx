export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <p>© {new Date().getFullYear()} ACC Store</p>
        <a href="https://nextjs.org" target="_blank" rel="noreferrer" className="hover:underline">Powered by Next.js</a>
      </div>
    </footer>
  );
}

