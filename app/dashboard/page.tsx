import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <DashboardShell
      userName={session.user.name ?? "Authenticated User"}
      userEmail={session.user.email ?? "No email"}
    />
  );
}
