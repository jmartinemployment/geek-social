import { Loading } from "@/components/ui";

/** Shown while a page's route loads: placeholders in the page's width, so nothing jumps. */
export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-5 lg:px-8">
      <Loading what="the page" />
    </div>
  );
}
