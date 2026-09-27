"use client";

import { MobileLayout } from "@/components/mobile/mobile-layout";
import { MobileEditProfile } from "@/components/mobile/mobile-edit-profile";
import { withAuth } from "@/lib/auth-guard";

function MobileEditProfilePage() {
  return (
    <MobileLayout title="Edit Profile" showBack showBottomNav={false}>
      <MobileEditProfile />
    </MobileLayout>
  );
}

export default withAuth(MobileEditProfilePage);
