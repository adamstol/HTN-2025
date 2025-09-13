import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import Spinner from "@/components/spinner";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Spinner />}>
        <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
