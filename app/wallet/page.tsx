import { auth } from "@/auth";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function WalletPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");
  return <WalletDashboard email={session.user.email} />;
}
