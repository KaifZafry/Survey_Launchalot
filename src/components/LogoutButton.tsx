"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const r = useRouter();
  const logout = () => {
    localStorage.removeItem("admin_token");
    document.cookie = "admin_token=; Max-Age=0; Path=/";
    r.replace("/login");
  };
  return (
    <button onClick={logout} className={className}>
      Logout
    </button>
  );
}
