// Dashboard Layout — renders children cleanly; AuthenticatedShell handles
// auth check & sidebar inside Suspense for Next.js Cache Components.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
