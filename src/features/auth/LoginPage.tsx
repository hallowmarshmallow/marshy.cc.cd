import { useState, type FormEvent } from "react";
import { Atmosphere } from "../../components/atmosphere/Atmosphere";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { useToast } from "../../components/ui/Toast";
import { Link } from "../../app/router";
import {
  backend,
  BackendError,
  isBackendConfigured,
  UNCONFIGURED_MESSAGE,
} from "../../services";

export function LoginPage({
  onAuthSuccess,
  reason,
}: {
  onAuthSuccess: () => void;
  reason?: string;
}) {
  const showToast = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<BackendError | null>(null);

  const configured = isBackendConfigured();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!configured) {
      setFormError(new BackendError("provider_error", UNCONFIGURED_MESSAGE));
      return;
    }
    if (mode === "signup" && (!inviteCode.trim() || !handle.trim())) {
      setFormError(
        new BackendError(
          "validation_failed",
          "Add your invite code and choose a handle to enter.",
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
        showToast(
          "success",
          "You’re on the list. Check your inbox to verify your email.",
        );
      } else {
        await backend.auth.signIn({ email, password });
        onAuthSuccess();
      }
    } catch (err) {
      const fallback =
        mode === "signup"
          ? "That invite did not open the door. Check the code and try again."
          : "Something went wrong. Please try again.";
      setFormError(
        err instanceof BackendError
          ? err
          : new BackendError("server_error", fallback),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Atmosphere />
      <div className="auth-shell">
        <Link to="/" className="auth-backlink">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to
          the porch
        </Link>
        <div className="auth-layout">
          <section className="auth-intro" aria-labelledby="auth-heading">
            <p className="auth-kicker">
              <span className="live-mark" aria-hidden="true" /> Private beta ·
              invite only
            </p>
            <h1 id="auth-heading">A quieter kind of online.</h1>
            <p>
              Hallowmarsh is a small room for people who make things, share
              unfinished thoughts, and know when to leave the noise outside.
            </p>
            <div className="auth-signals" aria-label="What members get">
              <span>
                <i className="fa-solid fa-lock" aria-hidden="true" />{" "}
                Member-only feed
              </span>
              <span>
                <i className="fa-solid fa-feather-pointed" aria-hidden="true" />{" "}
                Low-pressure sharing
              </span>
              <span>
                <i className="fa-solid fa-moon" aria-hidden="true" /> No public
                profiles
              </span>
            </div>
          </section>

          <GlassCard className="auth-card">
            <div className="auth-card-heading">
              <p className="auth-glyph" aria-hidden="true">
                <i className="fa-solid fa-ghost" />
              </p>
              <div>
                <p className="auth-overline">Welcome back</p>
                <h2 className="auth-title">
                  {mode === "signin" ? "Enter the marsh" : "Use your invite"}
                </h2>
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
                  The backend isn’t connected yet.
                </p>
                <p className="auth-unconfigured-note">
                  Add the Supabase URL and anon key from{" "}
                  <code>.env.example</code> to enable the door.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void onSubmit(e)} noValidate>
                {formError ? (
                  <p className="form-error" role="alert">
                    {formError.message}
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
                      Ask someone already inside for a code.
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
                <Button type="submit" loading={busy} className="auth-submit">
                  <i
                    className={`fa-solid ${mode === "signup" ? "fa-key" : "fa-door-open"}`}
                    aria-hidden="true"
                  />
                  {mode === "signup" ? "Create member account" : "Sign in"}
                </Button>
              </form>
            )}
            {configured ? (
              <button
                type="button"
                className="linklike"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setFormError(null);
                }}
              >
                {mode === "signin"
                  ? "I have an invite →"
                  : "Already inside? Sign in →"}
              </button>
            ) : null}
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
