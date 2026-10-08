import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">BidNest</h1>
        <nav className="flex gap-4">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-blue-50 p-8 rounded-xl text-center mb-8">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Find your next treasure</h2>
          <p className="text-gray-600 mb-6">Fair, transparent auctions with provable randomness.</p>
          <Link href="/browse" className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">
            Browse Auctions
          </Link>
        </div>
      </main>
    </div>
  );
}
