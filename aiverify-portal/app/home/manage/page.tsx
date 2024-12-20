import { UserManageFlowCards } from './components/userManageFlowCards';

export default function ManagePage() {
  return (
    <main className="w-full px-6">
      <h1 className="my-6 text-2xl font-bold tracking-wide">Manage Models and Resources</h1>
      <UserManageFlowCards />
    </main>
  );
}
