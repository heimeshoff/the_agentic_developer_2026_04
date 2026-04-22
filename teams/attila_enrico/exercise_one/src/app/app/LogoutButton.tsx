import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded border border-border bg-surface px-3 py-1 text-xs hover:bg-bg"
      >
        Log out
      </button>
    </form>
  );
}
