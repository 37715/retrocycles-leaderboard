import { ProfileApp } from "@/src/profile/ProfileApp";
import { Suspense } from "react";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="profile-loading">loading profile...</div>}>
      <ProfileApp />
    </Suspense>
  );
}
