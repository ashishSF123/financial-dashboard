import { auth, signOut } from "@/lib/auth";

export async function UserAvatar() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.68rem] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] transition-colors"
        title={`Signed in as ${session.user.name || session.user.email}`}
      >
        {session.user.image && (
          <img src={session.user.image} alt="" className="w-5 h-5 rounded-full" />
        )}
        <span className="hidden md:inline">Sign out</span>
      </button>
    </form>
  );
}
