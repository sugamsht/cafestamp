import React from "react";
import { MailOpen, RefreshCcw } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { trackEvent } from "../lib/analytics";
import { useLanguage } from "../lib/i18n/LanguageContext";

export const VerifyBanner: React.FC = () => {
  const { t } = useLanguage();
  const { currentOwner, isEmailVerified, resendVerificationEmail, refreshProfile } = useAuth();
  const [resending, setResending] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  if (!currentOwner || isEmailVerified) return null;

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    const result = await resendVerificationEmail();
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    trackEvent("Verification Email Resent", { role: currentOwner.role });
    setMessage(result.message ?? t('verify_sent'));
  };

  const handleRefresh = async () => {
    setError("");
    setMessage("");
    setRefreshing(true);
    try {
      await refreshProfile();
      setMessage(t('verify_refreshed'));
    } catch {
      setError(t('verify_refresh_err'));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-4 md:mx-6 mt-4 md:mt-6 rounded-2xl md:rounded-lg border border-border/80 bg-card p-4 md:p-5 shadow-subtle">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/80 bg-background text-foreground shadow-subtle">
            <MailOpen size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t('verify_title')}
            </div>
            <div className="mt-1 text-base font-semibold text-foreground">
              {t('verify_desc')}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('verify_help')}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleResend}
            className="h-11 px-6 text-base"
            disabled={resending || refreshing}
          >
            <MailOpen className="mr-2" size={18} />
            {resending ? t('verify_sending') : t('verify_resend')}
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="h-11 px-6 text-base"
            disabled={resending || refreshing}
          >
            <RefreshCcw className="mr-2" size={18} />
            {refreshing ? t('verify_refreshing') : t('verify_refresh')}
          </Button>
        </div>
      </div>
      {message && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
};
