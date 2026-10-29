import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "../lib/i18n/LanguageContext";

const inputCls =
  "h-12 rounded-xl border-black/[0.1] bg-[#f5f5f7] text-base text-[#1d1d1f] placeholder:text-[#6e6e73]/50 focus-visible:border-[#1d1d1f] focus-visible:ring-0";
const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6e6e73]";

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (currentUser) {
    return <Navigate to="/settings" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t('forgot_empty_email'));
      return;
    }
    setBusy(true);
    const result = await resetPassword(email.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        title={t('forgot_sent_title')}
        subtitle={t('forgot_sent_subtitle')}
        badge={t('dashboard_step_completed')}
        theme="login"
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1d1d1f]">{t('forgot_sent_heading')}</h2>
            <p className="mt-1 text-sm text-[#6e6e73]">
              {t('forgot_sent_body', { email })}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1d1d1f] text-base font-medium text-white shadow-sm hover:bg-black/80"
          >
            {t('forgot_back_to_login')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('forgot_title')}
      subtitle={t('forgot_subtitle')}
      badge={t('forgot_badge')}
      theme="login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">{t('forgot_find_account')}</h2>
          <p className="mt-1 text-sm text-[#6e6e73]">{t('forgot_find_account_sub')}</p>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>{t('forgot_email_label')}</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@brand.com"
            className={inputCls}
            type="email"
            autoComplete="email"
            required
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-full bg-[#1d1d1f] text-base font-medium text-white shadow-sm hover:bg-black/80"
        >
          {busy ? t('forgot_sending') : t('forgot_send_btn')}
          {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>

        <p className="text-center text-sm text-[#6e6e73]">
          {t('forgot_remember')}{" "}
          <Link to="/login" className="font-semibold text-[#1d1d1f] underline-offset-2 hover:underline">
            {t('forgot_sign_in')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
