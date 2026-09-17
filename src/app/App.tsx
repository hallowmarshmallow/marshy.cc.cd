import { useEffect } from "react";
import { useRoute, matchRoute, navigate } from "./router";
import { useSession } from "../hooks/useSession";
import { PortfolioPage } from "../features/portfolio/PortfolioPage";
import { BlogPage } from "../features/blog/BlogPage";
import { LoginPage } from "../features/auth/LoginPage";
import { FeedPage } from "../features/feed/FeedPage";
import { ProfilePage } from "../features/profiles/ProfilePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { AdminPage } from "../features/admin/AdminPage";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Routing and shells: signed-out visitors see the public landing page,
 * signed-in users see the feed, and app routes redirect to sign-in.
 */
export function App() {
  const path = useRoute();
  const { session, loading } = useSession();

  // Authenticated users are never forced through the portfolio.
  useEffect(() => {
    if (!loading && session && (path === "/" || path === "/login"))
      navigate("/feed");
  }, [loading, session, path]);

  // Guard: app routes and profiles require a session once the session check has resolved.
  useEffect(() => {
    if (
      !loading &&
      !session &&
      (path === "/feed" ||
        path === "/settings" ||
        path === "/admin" ||
        path.startsWith("/u/"))
    )
      navigate("/login");
  }, [loading, session, path]);

  if (loading && path !== "/" && path !== "/login") {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <p>Loading…</p>
      </div>
    );
  }

  const profileMatch = matchRoute("/u/:handle", path);
  if (profileMatch) {
    if (!session) {
      return (
        <LoginPage
          onAuthSuccess={() => navigate("/feed")}
          reason="Member profiles are private."
        />
      );
    }
    return <ProfilePage handle={profileMatch.handle} />;
  }

  switch (path) {
    case "/":
      return <PortfolioPage />;
    case "/blog":
      return <BlogPage />;
    case "/login":
      return <LoginPage onAuthSuccess={() => navigate("/feed")} />;
    case "/feed":
      return session ? <FeedPage /> : null;
    case "/settings":
      return session ? <SettingsPage /> : null;
    case "/admin":
      return session ? <AdminPage /> : null;
    default:
      return <NotFoundPage />;
  }
}
