import MenuEditor from "@/components/menus/menu-editor";

type MenuEditorPageProps = {
  params: Promise<{
    menuId: string;
  }>;
};

export default async function MenuEditorPage({
  params,
}: MenuEditorPageProps) {
  const { menuId } =
    await params;

  return (
    <MenuEditor
      menuId={menuId}
    />
  );
}