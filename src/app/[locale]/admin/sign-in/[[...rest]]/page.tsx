import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign in · Admin" };

export default function AdminSignInPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <SignIn
        path="/admin/sign-in"
        routing="path"
        forceRedirectUrl="/admin/articles"
        signUpUrl="/admin/sign-in"
      />
    </div>
  );
}
