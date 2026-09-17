import { useEffect } from "react";
import { useRoute, matchRoute, navigate } from "./router";
import { useSession } from "../hooks/useSession";
import { PortfolioPage } from "../features/portfolio/PortfolioPage";
import { LoginPage } from "../features/auth/LoginPage";
import { FeedPage } from "../features/feed/FeedPage";
import { ProfilePage } from "../features/profiles/ProfilePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Routing + shells: logged-out visitors get the private-beta porch;
 * authenticated users land in the member shell, never back through the porch.
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
      (path === "/feed" || path === "/settings" || path.startsWith("/u/"))
    )
      navigate("/login");
  }, [loading, session, path]);

  if (loading && path !== "/" && path !== "/login") {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <p>Wading into the marsh…</p>
      </div>
    );
  }

  const profileMatch = matchRoute("/u/:handle", path);
  if (profileMatch) {
    if (!session) {
      return (
        <LoginPage
          onAuthSuccess={() => navigate("/feed")}
          reason="Member profiles are private to the marsh."
        />
      );
    }
    return <ProfilePage handle={profileMatch.handle} />;
  }

  switch (path) {
    case "/":
      return <PortfolioPage />;
    case "/login":
      return <LoginPage onAuthSuccess={() => navigate("/feed")} />;
    case "/feed":
      return session ? <FeedPage /> : null;
    case "/settings":
      return session ? <SettingsPage /> : null;
    default:
      return <NotFoundPage />;
  }
}
