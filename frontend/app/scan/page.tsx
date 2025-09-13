import ScanPage from "@/components/ScanPage";
import { Suspense } from "react";
import Spinner from "@/components/spinner";

export default function ProfilePage() {

  return (
    <Suspense fallback={<Spinner />}>
      <ScanPage />
    </Suspense>
  );
}