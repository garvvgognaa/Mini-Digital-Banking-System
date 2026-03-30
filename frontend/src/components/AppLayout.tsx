import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/deposit", label: "Deposit" },
  { to: "/withdraw", label: "Withdraw" },
  { to: "/transfer", label: "Transfer" },
  { to: "/transactions", label: "History" },
];

export function AppLayout(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          MDBS
          <span>Mini Digital Banking</span>
        </div>
        <nav className="app-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={Boolean(item.end)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <div className="app-sidebar__user">{user?.email}</div>
          <button type="button" className="btn btn--danger-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
