export async function updateResultNameServer(id: number, name: string) {
  const response = await fetch(`http://127.0.0.1:4000/test_result/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update result: ${response.statusText}`);
  }

  return response.json();
}
