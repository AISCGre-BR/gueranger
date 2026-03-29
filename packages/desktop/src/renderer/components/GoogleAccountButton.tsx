import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LogIn, LogOut, Key, Loader2, AlertCircle, ChevronDown } from "lucide-react";

interface AuthState {
  signedIn: boolean;
  email: string;
  avatarUrl: string;
  loading: boolean;
  error: string | null;
  signIn: (rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

interface Props {
  auth: AuthState;
  onOpenDiamm: () => void;
}

export function GoogleAccountButton({ auth, onOpenDiamm }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside and Escape to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Loading state
  if (auth.loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {t("auth.signingIn")}
        </span>
      </div>
    );
  }

  // Error state (auto-clears after 5s)
  if (auth.error !== null) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <span className="text-sm text-red-600 dark:text-red-400">
          {auth.error}
        </span>
      </div>
    );
  }

  // Signed-out state — dropdown with Google sign-in + DIAMM credentials
  if (!auth.signedIn) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <LogIn className="h-4 w-4" />
          {t("auth.accounts")}
          <ChevronDown className="h-3 w-3" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[260px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {/* Google sign-in section */}
            <div className="px-3 py-2">
              <label className="flex items-center gap-1.5 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={rememberMeChecked}
                  onChange={(e) => setRememberMeChecked(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("auth.rememberMe")}
                </span>
              </label>
              <button
                onClick={() => {
                  setOpen(false);
                  auth.signIn(rememberMeChecked);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md px-3 py-2 flex items-center justify-center gap-2 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <LogIn className="h-4 w-4" />
                {t("auth.signInGoogle")}
              </button>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700" />
            {/* DIAMM credentials — always accessible */}
            <button
              onClick={() => {
                onOpenDiamm();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Key className="h-3.5 w-3.5" />
              {t("auth.diammCredentials")}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Signed-in state with dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {auth.avatarUrl ? (
          <img
            src={auth.avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
            {auth.email.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[180px] truncate text-xs text-slate-600 dark:text-slate-300">
          {auth.email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {auth.email}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700" />
          <button
            onClick={() => {
              onOpenDiamm();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Key className="h-3.5 w-3.5" />
            {t("auth.diammCredentials")}
          </button>
          <div className="border-t border-slate-200 dark:border-slate-700" />
          <button
            onClick={() => {
              auth.signOut();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-slate-50 dark:text-red-400 dark:hover:bg-slate-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
