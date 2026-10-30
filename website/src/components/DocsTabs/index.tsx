"use client";
import { Tabs as FlowbiteTabs } from "flowbite-react";

function TabsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <FlowbiteTabs className="shadow">{children}</FlowbiteTabs>
    </div>
  );
}

function TabsItem({
  children,
  title,
  ...props
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <FlowbiteTabs.Item title={title} {...props}>
      {children}
    </FlowbiteTabs.Item>
  );
}

export { TabsGroup, TabsItem };
