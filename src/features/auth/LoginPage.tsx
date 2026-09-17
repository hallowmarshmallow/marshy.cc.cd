import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Link } from "../../app/router";
import {
  backend,
  BackendError,
  isBackendConfigured,
  UNCONFIGURED_MESSAGE,
} from "../../services";
import type { AuthProvider } from "../../types/domain";

type Mode = "signin" | "signup" | "reset";

const OAUTH_PROVIDERS: Array<{
  key: Exclude<AuthProvider, "email">;
  label: string;
  icon: string;
}> = [
  { key: "google", label: "Continue with Google", icon: "fa-brands fa-google" },
  { key: "discord", label: "Continue with Discord", icon: "fa-brands fa-discord" },
  { key: "github", label: "Continue with GitHub", icon: "fa-brands fa-github" },
];

export function LoginPage({
  onAuthSuccess,
  reason,
}: {
  onAuthSuccess: () => void;
  reason?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthPending, setOauthPending] = useState<AuthProvider | null>(null);
  const [formError, setFormError] = useState<BackendError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const configured = isBackendConfigured();

  function switchMode(next: Mode) {
    setMode(next);
    setFormError(null);
    setNotice(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!configured) {
      setFormError(new BackendError("provider_error", UNCONFIGURED_MESSAGE));
      return;
    }
    if (mode === "signup" && (!inviteCode.trim() || !handle.trim())) {
      setFormError(
        new BackendError(
          "validation_failed",
          "Enter your invite code and choose a handle.",
        ),
      );
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      if (mode === "signup") {
        await backend.auth.signUp({
          email,
          password,
          handle: handle.trim().toLowerCase(),
          inviteCode,
        });
        setNotice("Account created. Check your inbox to verify your email.");
      } else if (mode === "reset") {
        await backend.auth.requestPasswordReset(email);
        setNotice(
          "If that email matches an account, a reset link is on its way.",
        );
      } else {
        await backend.auth.signIn({ email, password });
        onAuthSuccess();
      }
    } catch (err) {
      const fallback =
        mode === "signup"
          ? "That invite did not work. Check the code and try again."
          : "Something went wrong. Try again.";
      setFormError(
        err instanceof BackendError
          ? err
          : new BackendError("server_error", fallback),
      );
    } finally {
      setBusy(false);
    }
  }

  async function onOAuth(provider: Exclude<AuthProvider, "email">) {
    setFormError(null);
    setNotice(null);
    setOauthPending(provider);
    try {
      await backend.auth.signInWithOAuth(provider);
      // A successful call redirects the browser to the provider.
    } catch (err) {
      setFormError(
        err instanceof BackendError
          ? err
          : new BackendError(
              "provider_error",
              "Could not start that sign-in. Try again.",
            ),
      );
      setOauthPending(null);
    }
  }

  const title =
    mode === "signup"
      ? "Use your invite"
      : mode === "reset"
        ? "Reset your password"
        : "Sign in";

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-backlink">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
        </Link>
        <div className="auth-layout">
          <section className="auth-intro" aria-labelledby="auth-heading">
            <p className="auth-kicker">Private beta · invite only</p>
            <h1 id="auth-heading">A private room for people who make things.</h1>
            <p>
              Hallowmarsh is a small community for people who make things, share
              unfinished work, and leave the noise outside.
            </p>
            <div className="auth-signals" aria-label="What members get">
              <span>Member-only feed</span>
              <span>Low-pressure sharing</span>
              <span>No public profiles</span>
            </div>
          </section>

          <Card className="auth-card">
            <div className="auth-card-heading">
              <div>
                <p className="auth-overline">
                  {mode === "signup" ? "Join the beta" : "Hallowmarsh"}
                </p>
                <h2 className="auth-title">{title}</h2>
              </div>
            </div>

            {reason ? (
              <p className="auth-route-note">
                <i className="fa-solid fa-lock" aria-hidden="true" /> {reason}
              </p>
            ) : null}

            {!configured ? (
              <div className="auth-unconfigured" role="note">
                <p>
                  <i
                    className="fa-solid fa-plug-circle-exclamation"
                    aria-hidden="true"
                  />{" "}
                  The backend isn't connected yet.
                </p>
                <p className="auth-unconfigured-note">
                  Add the Supabase URL and anon key from{" "}
                  <code>.env.example</code> to enable sign-in.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void onSubmit(e)} noValidate>
                {formError ? (
                  <p className="form-error" role="alert">
                    {formError.message}
                  </p>
                ) : null}
                {notice ? (
                  <p className="form-success" role="status">
                    {notice}
                  </p>
                ) : null}

                {mode === "signup" ? (
                  <>
                    <label className="field-label" htmlFor="invite-code">
                      Invite code
                    </label>
                    <input
                      id="invite-code"
                      name="invite-code"
                      type="text"
                      autoComplete="one-time-code"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="text-input invite-input"
                      placeholder="MARSH-XXXX"
                    />
                    <p className="field-hint">
                      Ask someone inside for a code.
                    </p>
                    <label className="field-label" htmlFor="handle">
                      Handle
                    </label>
                    <input
                      id="handle"
                      name="handle"
                      type="text"
                      autoComplete="username"
                      required
                      minLength={3}
                      maxLength={24}
                      pattern="[a-z0-9_]+"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="text-input"
                      placeholder="your_corner"
                    />
                  </>
                ) : null}

                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-input"
                />

                {mode !== "reset" ? (
                  <>
                    <label className="field-label" htmlFor="password">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-input"
                      aria-describedby="password-req"
                    />
                    <p id="password-req" className="field-hint">
                      8+ characters.
                    </p>
                  </>
                ) : null}

                <Button type="submit" loading={busy} className="auth-submit">
                  {mode === "signup"
                    ? "Create account"
                    : mode === "reset"
                      ? "Send reset link"
                      : "Sign in"}
                </Button>
              </form>
            )}

            {configured && mode !== "signup" ? (
              <>
                <div className="auth-divider">or</div>
                <div className="oauth-grid">
                  {OAUTH_PROVIDERS.map((provider) => (
                    <button
                      key={provider.key}
                      type="button"
                      className="oauth-btn"
                      disabled={oauthPending !== null}
                      onClick={() => void onOAuth(provider.key)}
                    >
                      <i className={provider.icon} aria-hidden="true" />
                      {provider.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {configured ? (
              <div className="auth-links">
                {mode === "signin" ? (
                  <>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => switchMode("signup")}
                    >
                      I have an invite
                    </button>
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => switchMode("reset")}
                    >
                      Forgot password?
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => switchMode("signin")}
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </main>
  );
}
