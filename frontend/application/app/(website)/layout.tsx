import DynamicMenus from "@/components/menus/DynamicMenus";
import { fetchMenu } from "@/components/menus/menu-api";
import AuthFloatingWidget from "@/components/AuthFloatingWidget";

export const dynamic = "force-dynamic";

export default async function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [top, left, bottom] = await Promise.all([
    fetchMenu("top"),
    fetchMenu("left"),
    fetchMenu("bottom"),
  ]);

  return (
    <DynamicMenus
      initialMenus={{ top, left, bottom }}
    >
      {/* Wrap children in a fluid, centered container so it never hugs the extreme left */}
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>

      <AuthFloatingWidget />
    </DynamicMenus>
  );
}