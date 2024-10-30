import { Cards } from './cards';

export default function HomePage() {
  return (
    <main className="w-full px-6">
      <h1 className="text-xl font-bold">
        Welcome, what would you like to do today?
      </h1>
      <Cards />
    </main>
  );
}
