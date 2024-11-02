import { redirectRoute } from '@/lib/actions/redirectRoute';

export default async function Home() {
  await redirectRoute('/home');
  return;
}
