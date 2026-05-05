import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { requireAdmin } from "@/lib/authz";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guard = await requireAdmin();

  console.log("[ADMIN_LAYOUT] guard result", {
    ok: guard.ok,
    status: guard.status,
    hasSession: !!guard.session,
    user: guard.session?.user
      ? {
          id: guard.session.user.id,
          email: guard.session.user.email,
          role: guard.session.user.role,
          status: guard.session.user.status,
          isActive: guard.session.user.isActive,
          authTime: guard.session.user.authTime,
        }
      : null,
  });

  if (!guard.ok) {
    if (guard.status === 401) {
      console.log("[ADMIN_LAYOUT] redirecting to /login because unauthorized");
      redirect("/login?error=unauthorized");
    }

    console.log("[ADMIN_LAYOUT] redirecting to /login בגלל forbidden");
    redirect("/login?error=forbidden");
  }

  console.log("[ADMIN_LAYOUT] render admin layout success", {
    userId: guard.session?.user?.id,
    email: guard.session?.user?.email,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <Topbar />
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}