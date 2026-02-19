import { ProfilePage } from "@/src/profile/ProfileApp";
import { Suspense } from "react";

export default function ProfileRoutePage() {
  return (
    <Suspense fallback={<div className="profile-loading">loading profile...</div>}>
      <ProfilePage />
    </Suspense>
  );
}
