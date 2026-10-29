import React from 'react';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Wallet, History, QrCode, Crown, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useSubscriptionContext } from './SubscriptionContext';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { TranslationKey } from '../lib/i18n/translations';

interface SidebarProps {
  className?: string;
  onScanQr?: () => void;
}

interface SidebarContentProps {
  onNavigate?: () => void;
  onScanQr?: () => void;
}

export const NAV_ITEMS = [
  { path: '/dashboard', labelKey: 'nav_dashboard' as TranslationKey, icon: LayoutDashboard, roles: ['owner'] },
  { path: '/campaigns', labelKey: 'nav_campaigns' as TranslationKey, icon: CreditCard, roles: ['owner'] },
  { path: '/issued-cards', labelKey: 'nav_issued_cards' as TranslationKey, icon: Wallet, roles: ['owner', 'staff'] },
  { path: '/transactions', labelKey: 'nav_transactions' as TranslationKey, icon: History, roles: ['owner'] },
  { path: '/customers', labelKey: 'nav_customers' as TranslationKey, icon: Users, roles: ['owner', 'staff'] },
  { path: '/analytics', labelKey: 'nav_analytics' as TranslationKey, icon: Sparkles, roles: ['owner'] },
  { path: '/settings', labelKey: 'nav_settings' as TranslationKey, icon: Settings, roles: ['owner'] },
];

const PlanBadge: React.FC = () => {
  const { t } = useLanguage();
  const {
    isProTier,
    campaignCount,
    campaignLimit,
    issuedCardCount,
    cardLimit,
  } = useSubscriptionContext();
  const { isStaff } = useAuth();
  if (isStaff) return null;

  if (isProTier) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-2 text-xs">
        <Crown size={14} className="text-amber-500" />
        <span className="font-semibold text-amber-700">{t('plan_pro')}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-xs space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{t('plan_beta')}</span>
        <Sparkles size={12} className="text-muted-foreground" />
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>{t('plan_campaigns', { count: campaignCount, limit: campaignLimit === Infinity ? '∞' : campaignLimit })}</span>
        <span className="text-border">|</span>
        <span>{t('plan_cards', { count: issuedCardCount, limit: cardLimit === Infinity ? '∞' : cardLimit })}</span>
      </div>
    </div>
  );
};

export const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate, onScanQr }) => {
  const navigate = useNavigate();
  const { currentUser, currentOwner, isStaff, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex h-full flex-col overflow-y-auto py-4 md:py-6">
      <div className="px-3 py-2">
        <div className="mb-6 px-4 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center" onClick={onNavigate}>
            <img
              src="/stampee.svg"
              alt="Stampee logo"
              className="h-12 w-auto"
            />
          </Link>
        </div>
        <div className="space-y-2">
          {NAV_ITEMS.filter((item) => item.roles.includes(isStaff ? 'staff' : 'owner')).map((item) => (
            <NavLink to={item.path} key={item.path} onClick={onNavigate}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <item.icon size={20} />
                  {t(item.labelKey)}
                </Button>
              )}
            </NavLink>
          ))}
          {isStaff && (
            <Button
              variant="default"
              className="w-full justify-start gap-2 mt-2"
              onClick={() => {
                onScanQr?.();
                onNavigate?.();
              }}
            >
              <QrCode size={20} />
              {t('nav_scan_qr')}
            </Button>
          )}
        </div>
      </div>
      <div className="mt-auto px-4 pt-6 space-y-3">
         <div className="pb-1">
           <LanguageSwitcher variant="pill" />
         </div>
         <PlanBadge />
         {currentUser && (
          <div className="rounded-lg border border-border/80 bg-card px-3 py-3 text-xs text-muted-foreground shadow-subtle">
              <div className="font-semibold text-foreground">{currentUser.businessName}</div>
              <div className="font-mono">@{currentOwner?.slug ?? "staff"}</div>
              {isStaff && <div className="text-[10px] uppercase tracking-widest mt-1">{t('nav_staff_access')}</div>}
          </div>
         )}
         <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
         >
            <LogOut size={20} />
            {t('nav_logout')}
         </Button>
         <div className="px-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            v0.5
         </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ className, onScanQr }) => {
  return (
    <div className={cn("hidden h-screen w-72 border-r border-border/80 bg-card md:block", className)}>
      <SidebarContent onScanQr={onScanQr} />
    </div>
  );
};
