import { Loading } from "@/components/ui";

/** Shown while the welcome page reads the person's tenant: placeholders in the page's width, so nothing jumps. */
export default function WelcomeLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <Loading what="your account" />
    </div>
  );
}
