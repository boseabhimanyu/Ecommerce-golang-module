export type MenuItem = {
  id: string;
  label: string;
  type: string;
  pageId: string | null;
  url: string;
  order: number;
  displayStatus: boolean;
  children: MenuItem[];
};

export type Menu = {
  name: string;
  location: "top" | "left" | "bottom" | string;
  status: boolean;
  items: MenuItem[];
};

export type MenuResponse = {
  menu?: Menu;
  error?: string;
};