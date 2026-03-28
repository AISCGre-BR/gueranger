import { useState, useEffect, useCallback, useRef } from "react";

interface AuthState {
  signedIn: boolean;
  email: string;
  avatarUrl: string;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    signedIn: false,
    email: "",
    avatarUrl: "",
    loading: true,
    error: null,
  });
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.gueranger.googleGetStatus().then((status) => {
      setState({
        signedIn: status.signedIn,
        email: status.email ?? "",
        avatarUrl: status.avatarUrl ?? "",
        loading: false,
        error: null,
      });
    }).catch(() => {
      setState((prev) => ({ ...prev, loading: false }));
    });
  }, []);

  const signIn = useCallback(async (rememberMe: boolean) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await window.gueranger.googleSignIn(rememberMe);
      setState({
        signedIn: true,
        email: result.email,
        avatarUrl: result.avatarUrl,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      // Auto-clear error after 3 seconds
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, error: null }));
      }, 3000);
    }
  }, []);

  const signOut = useCallback(async () => {
    await window.gueranger.googleSignOut();
    setState({
      signedIn: false,
      email: "",
      avatarUrl: "",
      loading: false,
      error: null,
    });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  return { ...state, signIn, signOut };
}
