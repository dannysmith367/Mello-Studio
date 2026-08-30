import { LoginForm } from "./LoginForm";
import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[80svh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <BrandMark size={44} className="mx-auto opacity-90" />
        <h1 className="mt-7 text-center font-display text-xl font-medium tracking-tight">
          Studio admin
        </h1>
        <p className="mt-2 text-center font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          Sign in to manage the shop
        </p>

        <LoginForm next={next} />
      </div>
    </div>
  );
}
