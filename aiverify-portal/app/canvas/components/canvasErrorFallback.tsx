function ErrorFallback({ error }: { error: Error }) {
  return (
    <div
      role="alert"
      className="rounded bg-red-100 p-4 text-red-700">
      <p>Something went wrong:</p>
      <pre className="mt-2 text-sm">{error.message}</pre>
    </div>
  );
}

export { ErrorFallback };
