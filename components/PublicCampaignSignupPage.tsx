import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { fetchPublicCampaignSignupContext, registerPublicCampaignSignup } from '../lib/db/publicSignup';
import { isSupabaseConfigured } from '../lib/supabase';
import { ShieldCheck, Info } from 'lucide-react';

const SERVICE_UNAVAILABLE_MESSAGE = 'El servicio no está disponible temporalmente. Por favor, inténtalo más tarde.';

export const PublicCampaignSignupPage: React.FC = () => {
  const navigate = useNavigate();
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
  }, [campaignId, slug]);

  const disabled = context?.campaign.isEnabled === false;
  const isShowingPreRedirectLoader = preRedirectMessage.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Por favor, introduce tu nombre.');
      return;
    }
    if (!privacyAccepted) {
      setError('Debes aceptar la política de privacidad y las condiciones para obtener tu tarjeta.');
      return;
    }
    if (!slug || !campaignId) {
      setError('Enlace de registro no válido.');
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
      setPreRedirectMessage(
        result.outcome === 'issued'
          ? 'Generando tu tarjeta de fidelización. Por favor, espera...'
          : 'Accediendo a tu tarjeta de fidelización. Por favor, espera...'
      );
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigate(`/${slug}/${result.uniqueId}`, { replace: true });
      return;
    }

    setSubmitting(false);

    if (result.outcome === 'campaign_disabled_no_existing') {
      setError(
        'Los nuevos registros están pausados temporalmente para esta campaña. Si ya tienes una tarjeta en curso, introduce el mismo correo o teléfono que utilizaste anteriormente.'
      );
      return;
    }

    setError(result.error || 'No se pudo completar el registro. Inténtalo de nuevo.');
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
        {SERVICE_UNAVAILABLE_MESSAGE}
      </div>
    );
  }

  if (!context) {
    return (
      <div className="h-screen flex items-center justify-center px-6 text-center text-muted-foreground">
        El enlace del programa de fidelización no es válido o ha expirado.
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
          <div className="flex items-center justify-between">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#6e6e73]">
              Tarjeta de Fidelización
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={12} /> RGPD / España
            </span>
          </div>

          <h1 className="mt-3 text-[clamp(1.9rem,5vw,2.7rem)] font-black leading-[0.96] tracking-[-0.03em] text-[#1d1d1f]">
            {context.owner.businessName}
          </h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#4f5258]">
            Únete a <span className="font-semibold text-[#1d1d1f]">{context.campaign.name}</span> y empieza a acumular sellos con cada consumición.
          </p>

          {disabled && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Los nuevos registros están temporalmente pausados para esta campaña. Si ya tienes una tarjeta en curso, introduce el mismo correo o teléfono para continuar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-[#1d1d1f]">
                Nombre completo <span className="text-[#d73a49]">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María García"
                autoComplete="name"
                required
                className="h-12 rounded-xl border-black/10 text-[#1d1d1f] placeholder:text-[#8f9197]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1d1d1f]">
                Correo electrónico <span className="text-[#6e6e73] font-normal">(Opcional)</span>
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@ejemplo.es"
                autoComplete="email"
                type="email"
                className="h-12 rounded-xl border-black/10 text-[#1d1d1f] placeholder:text-[#8f9197]"
              />
              <p className="text-xs leading-5 text-[#6e6e73]">
                Te permite recuperar tu tarjeta en cualquier dispositivo y recibir aviso de tus recompensas.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mobile" className="text-sm font-medium text-[#1d1d1f]">
                Teléfono móvil <span className="text-[#6e6e73] font-normal">(Opcional)</span>
              </Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+34 612 34 56 78"
                autoComplete="tel"
                className="h-12 rounded-xl border-black/10 text-[#1d1d1f] placeholder:text-[#8f9197]"
              />
              <p className="text-xs leading-5 text-[#6e6e73]">
                Formato español (+34 6XX XX XX XX). Ayuda al camarero a localizar tu tarjeta en barra.
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
                  He leído y acepto las <span className="font-semibold text-[#1d1d1f]">condiciones del programa de fidelización</span> y la{' '}
                  <span className="font-semibold text-[#1d1d1f]">política de privacidad</span>.{' '}
                  <span className="text-[#d73a49]">*</span>
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
                  (Opcional) Deseo recibir ofertas exclusivas, novedades y promociones especiales del café por correo electrónico o SMS.
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
              {submitting ? 'Comprobando tarjeta...' : 'Obtener mi tarjeta de sellos'}
            </Button>
          </form>

          {/* First Layer Privacy Notice (RGPD / LOPDGDD España) */}
          <div className="mt-8 rounded-2xl bg-[#f5f5f7] p-4 text-[0.72rem] text-[#6e6e73] space-y-2 border border-black/5">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5 text-[0.68rem]">
                <Info size={13} className="text-[#1d1d1f]" /> Información sobre Protección de Datos (RGPD)
              </span>
              <button
                type="button"
                onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                className="text-xs font-medium text-[#1d1d1f] underline hover:opacity-75"
              >
                {showPrivacyDetails ? 'Menos info' : 'Más info'}
              </button>
            </div>

            <p className="leading-relaxed">
              <strong className="text-[#1d1d1f]">Responsable:</strong> {context.owner.businessName} &middot;{' '}
              <strong className="text-[#1d1d1f]">Finalidad:</strong> Gestión y emisión de la tarjeta digital de fidelización, cómputo de sellos y canje de consumiciones gratuitas.
            </p>

            {showPrivacyDetails && (
              <div className="space-y-1.5 pt-1 border-t border-black/5 text-[#6e6e73] leading-relaxed">
                <p>
                  <strong className="text-[#1d1d1f]">Legitimación:</strong> Consentimiento del interesado (art. 6.1.a RGPD) y ejecución de las condiciones del programa.
                </p>
                <p>
                  <strong className="text-[#1d1d1f]">Destinatarios:</strong> No se cederán datos a terceros ajenos a la prestación del servicio técnico ni se realizarán transferencias internacionales no autorizadas.
                </p>
                <p>
                  <strong className="text-[#1d1d1f]">Derechos:</strong> Puedes ejercitar tus derechos de acceso, rectificación, supresión (derecho al olvido), limitación y oposición solicitándolo directamente al establecimiento responsable del programa.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
