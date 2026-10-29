import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { fetchPublicCampaignSignupContext, registerPublicCampaignSignup } from '../lib/db/publicSignup';
import { isSupabaseConfigured } from '../lib/supabase';
import { ShieldCheck, Info } from 'lucide-react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { translateCampaignName } from '../lib/locale';

export const PublicCampaignSignupPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceNew = searchParams.get('new') === 'true';
  const { slug, campaignId } = useParams<{ slug: string; campaignId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preRedirectMessage, setPreRedirectMessage] = useState('');
  const [error, setError] = useState('');
  const [context, setContext] = useState<Awaited<ReturnType<typeof fetchPublicCampaignSignupContext>>>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !slug || !campaignId) {
      setLoading(false);
      return;
    }

    if (!forceNew) {
      try {
        const savedCardId = localStorage.getItem(`stampee_card_${slug}_${campaignId}`);
        if (savedCardId) {
          setPreRedirectMessage(t('signup_redirect_wait'));
          const timer = setTimeout(() => {
            navigate(`/${slug}/${savedCardId}`, { replace: true });
          }, 350);
          return () => clearTimeout(timer);
        }
      } catch {
        // ignore in private browsing / SSR
      }
    }

    let active = true;
    void (async () => {
      const payload = await fetchPublicCampaignSignupContext(slug, campaignId);
      if (!active) return;
      setContext(payload);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [campaignId, forceNew, navigate, slug, t]);

  const disabled = context?.campaign.isEnabled === false;
  const isShowingPreRedirectLoader = preRedirectMessage.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('signup_name_required'));
      return;
    }
    if (!privacyAccepted) {
      setError(t('signup_privacy_required'));
      return;
    }
    if (!slug || !campaignId) {
      setError(t('signup_invalid_link'));
      return;
    }

    setSubmitting(true);
    const result = await registerPublicCampaignSignup({
      slug,
      campaignId,
      name: trimmedName,
      email: email.trim(),
      mobile: mobile.trim(),
    });

    if (result.outcome === 'issued' || result.outcome === 'redirect_existing') {
      try {
        localStorage.setItem(`stampee_card_${slug}_${campaignId}`, result.uniqueId);
      } catch {
        // ignore
      }
      setPreRedirectMessage(
        result.outcome === 'issued'
          ? t('signup_gen_wait')
          : t('signup_redirect_wait')
      );
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate(`/${slug}/${result.uniqueId}`, { replace: true });
      return;
    }

    setSubmitting(false);

    if (result.outcome === 'campaign_disabled_no_existing') {
      setError(t('signup_paused'));
      return;
    }

    setError(result.error || t('signup_service_unavailable'));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="h-screen flex items-center justify-center px-6 text-center text-muted-foreground">
        {t('signup_service_unavailable')}
      </div>
    );
  }

  if (!context) {
    return (
      <div className="h-screen flex items-center justify-center px-6 text-center text-muted-foreground">
        {t('signup_invalid_link')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 py-10 sm:px-6 sm:py-14">
      {isShowingPreRedirectLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 text-center shadow-[0_18px_52px_-36px_rgba(0,0,0,0.45)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#1d1d1f] border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-[#1d1d1f]" aria-live="polite">
              {preRedirectMessage}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#efeff1]">
              <div className="h-full w-full origin-left animate-pulse rounded-full bg-[#1d1d1f]" />
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-xl">
        <section className="rounded-[2rem] border border-black/[0.08] bg-white p-6 shadow-[0_24px_64px_-38px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#6e6e73]">
                {t('signup_tagline')}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-emerald-700 border border-emerald-200">
                <ShieldCheck size={12} /> {t('signup_rgpd_badge')}
              </span>
            </div>
            <LanguageSwitcher variant="toggle" />
          </div>

          <h1 className="mt-3 text-[clamp(1.9rem,5vw,2.7rem)] font-black leading-[0.96] tracking-[-0.03em] text-[#1d1d1f]">
            {context.owner.businessName}
          </h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#4f5258]">
            {t('signup_join_campaign', { campaign: translateCampaignName(context.campaign.name, language) })}
          </p>

          {disabled && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {t('signup_paused')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-[#1d1d1f]">
                {t('signup_full_name')} <span className="text-[#d73a49]">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('signup_name_placeholder')}
                autoComplete="name"
                required
                className="h-12 rounded-xl border-black/10 text-[#1d1d1f] placeholder:text-[#8f9197]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1d1d1f]">
                {t('signup_email')} <span className="text-[#6e6e73] font-normal">({t('optional')})</span>
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signup_email_placeholder')}
                autoComplete="email"
                type="email"
                className="h-12 rounded-xl border-black/10 text-[#1d1d1f] placeholder:text-[#8f9197]"
              />
              <p className="text-xs leading-5 text-[#6e6e73]">
                {t('signup_email_helper')}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mobile" className="text-sm font-medium text-[#1d1d1f]">
                {t('signup_mobile')} <span className="text-[#6e6e73] font-normal">({t('optional')})</span>
              </Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t('signup_mobile_placeholder')}
                autoComplete="tel"
                className="h-12 rounded-xl border-black/10 text-[#1d1d1f] placeholder:text-[#8f9197]"
              />
              <p className="text-xs leading-5 text-[#6e6e73]">
                {t('signup_mobile_helper')}
              </p>
            </div>

            {/* RGPD Consent Section */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer text-xs leading-5 text-[#4f5258]">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-[#1d1d1f]"
                />
                <span>
                  {t('signup_privacy_consent')} <span className="text-[#d73a49]">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer text-xs leading-5 text-[#4f5258]">
                <input
                  type="checkbox"
                  checked={marketingAccepted}
                  onChange={(e) => setMarketingAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-[#1d1d1f]"
                />
                <span>
                  {t('signup_marketing_consent')}
                </span>
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#1d1d1f] text-sm font-semibold text-white hover:bg-black/85 transition-all shadow-sm"
              disabled={submitting}
            >
              {submitting ? t('signup_checking') : t('signup_get_card_btn')}
            </Button>
          </form>

          {/* First Layer Privacy Notice (RGPD / LOPDGDD España) */}
          <div className="mt-8 rounded-2xl bg-[#f5f5f7] p-4 text-[0.72rem] text-[#6e6e73] space-y-2 border border-black/5">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5 text-[0.68rem]">
                <Info size={13} className="text-[#1d1d1f]" /> {t('signup_privacy_info_title')}
              </span>
              <button
                type="button"
                onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                className="text-xs font-medium text-[#1d1d1f] underline hover:opacity-75"
              >
                {showPrivacyDetails ? t('signup_privacy_less') : t('signup_privacy_more')}
              </button>
            </div>

            <p className="leading-relaxed">
              <strong className="text-[#1d1d1f]">{t('signup_privacy_controller')}:</strong> {context.owner.businessName} &middot;{' '}
              <strong className="text-[#1d1d1f]">{t('signup_privacy_purpose')}:</strong> {t('signup_privacy_purpose_desc')}
            </p>

            {showPrivacyDetails && (
              <div className="space-y-1.5 pt-1 border-t border-black/5 text-[#6e6e73] leading-relaxed">
                <p>
                  <strong className="text-[#1d1d1f]">{t('signup_privacy_legal_basis')}:</strong> {t('signup_privacy_legal_basis_desc')}
                </p>
                <p>
                  <strong className="text-[#1d1d1f]">{t('signup_privacy_recipients')}:</strong> {t('signup_privacy_recipients_desc')}
                </p>
                <p>
                  <strong className="text-[#1d1d1f]">{t('signup_privacy_rights')}:</strong> {t('signup_privacy_rights_desc')}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
