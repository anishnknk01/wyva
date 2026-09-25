"use client";

import { RoleLayout }          from "@/components/layout/role-layout";
import { NotificationSettings } from "@/components/mobile/notification-settings";

export default function SettingsPage() {
  return (
    <RoleLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <NotificationSettings />
      </div>
    </RoleLayout>
  );
}
