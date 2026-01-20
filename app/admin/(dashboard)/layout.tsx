import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Users, Settings, LogOut, Shield, Building2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const SidebarContent = () => (
  <div className="flex flex-col h-full">
    <div className="p-6 border-b flex items-center gap-2">
      <Shield className="h-6 w-6 text-primary" />
      <h1 className="font-bold text-xl tracking-tight">Admin</h1>
    </div>

    <nav className="flex-1 p-4 space-y-1">
      <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <Link href="/admin/feedback" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <MessageSquare className="h-4 w-4" />
        Feedback
      </Link>
      <Link href="/admin/businesses" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <Building2 className="h-4 w-4" />
        Businesses
      </Link>
      <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <Users className="h-4 w-4" />
        Users
      </Link>
      <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </nav>

    <div className="p-4 border-t">
      <form action={async () => {
        "use server"
      }}>
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50" asChild>
          <Link href="/api/auth/signout">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Link>
        </Button>
      </form>
    </div>
  </div>
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-background border-r shadow-sm hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-background border-b flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>

            <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">Welcome, {session.user.name}</h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Go to App</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
