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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.68rem] text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
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
