export default function SelectDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1F2937]">
      <header className="border-b border-gray-700 bg-[#2D3142] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">Design Report</h1>
            <span className="text-sm text-gray-400">
              Autosaved at {new Date().toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>
            <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Next
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto">{children}</main>
    </div>
  );
}
