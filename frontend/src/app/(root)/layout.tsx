import { AuthOverlay } from "@/src/components/AuthOverlay";
import { Sidebar } from "@/src/components/Sidebar";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen">
      <AuthOverlay />
      <Sidebar />
      {children}
    </main>
  );
}
