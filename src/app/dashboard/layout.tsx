import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#02040a]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen p-6 md:p-8 text-slate-100">
        {children}
      </main>
    </div>
  );
}
