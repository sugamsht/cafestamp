import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "./AuthProvider";
import { buildStaffPortalUrl } from "../lib/links";
import { useNavigate } from "react-router-dom";
import { useSubscriptionContext } from "./SubscriptionContext";
import { useLanguage } from "../lib/i18n/LanguageContext";

const DELETE_CONFIRMATION = "DELETE";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { staffAccounts, createStaff, updateStaffPin, setStaffAccess, deleteStaff, currentOwner, currentUser, deleteAccount, updateProfileInfo, updatePassword } = useAuth();
  useSubscriptionContext();

  const [profileForm, setProfileForm] = useState({
    businessName: currentUser?.businessName ?? "",
    email: currentUser?.email ?? "",
    slug: currentOwner?.slug ?? "",
  });
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
    setProfileForm({
      businessName: currentUser?.businessName ?? "",
      email: currentUser?.email ?? "",
      slug: currentOwner?.slug ?? "",
    });
  }, [currentUser, currentOwner]);

  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", pin: "" });
  const [error, setError] = useState("");
  const [staffBusy, setStaffBusy] = useState(false);
  const [staffActionBusyId, setStaffActionBusyId] = useState<string | null>(null);
  const [staffActionError, setStaffActionError] = useState("");
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteStaffError, setDeleteStaffError] = useState("");
  const [deleteStaffBusy, setDeleteStaffBusy] = useState(false);
  const [isDeleteStepOneOpen, setIsDeleteStepOneOpen] = useState(false);
  const [isDeleteStepTwoOpen, setIsDeleteStepTwoOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileBusy(true);
    const result = await updateProfileInfo({
      businessName: profileForm.businessName,
      email: profileForm.email,
    });
    setProfileBusy(false);
    if (!result.ok) {
      setProfileError(result.error);
    } else {
      setProfileSuccess(t('settings_profile_success'));
      setTimeout(() => setProfileSuccess(""), 3000);
    }
  };

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError(t('settings_password_mismatch'));
      return;
    }
    setPasswordBusy(true);
    const result = await updatePassword(passwordForm.next);
    setPasswordBusy(false);
    if (!result.ok) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(t('settings_password_success'));
      setPasswordForm({ next: "", confirm: "" });
      setTimeout(() => setPasswordSuccess(""), 3000);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStaffActionError("");
    setStaffBusy(true);
    const result = await createStaff(form);
    setStaffBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm({ name: "", email: "", pin: "" });
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    setResetError("");
    setResetBusy(true);
    const result = await updateStaffPin(resetTarget.id, resetPin);
    setResetBusy(false);
    if (!result.ok) {
      setResetError(result.error);
      return;
    }
    setResetPin("");
    setResetTarget(null);
  };

  const handleSetStaffAccess = async (staffId: string, access: "active" | "disabled") => {
    setStaffActionError("");
    setStaffActionBusyId(staffId);
    const result = await setStaffAccess(staffId, access);
    setStaffActionBusyId(null);
    if (!result.ok) {
      setStaffActionError(result.error);
    }
  };

  const handleDeleteFinal = async () => {
    setDeleteError("");
    if (deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRMATION) {
      setDeleteError(`Type ${DELETE_CONFIRMATION} to confirm account deletion.`);
      return;
    }

    setDeleteAccountBusy(true);
    const result = await deleteAccount();
    setDeleteAccountBusy(false);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }

    setIsDeleteStepTwoOpen(false);
    setDeleteConfirmText("");
    navigate("/signup");
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaffTarget) return;
    setDeleteStaffError("");
    setDeleteStaffBusy(true);
    const result = await deleteStaff(deleteStaffTarget.id);
    setDeleteStaffBusy(false);
    if (!result.ok) {
      setDeleteStaffError(result.error);
      return;
    }
    setDeleteStaffTarget(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in h-full overflow-y-auto flex flex-col bg-gray-50/50">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t('settings_title')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings_subtitle')}</p>
      </div>

      {/* Edit Profile */}
      <section className="rounded-2xl md:rounded-3xl border bg-white p-4 md:p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{t('settings_profile_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings_profile_subtitle')}</p>
        </div>
        <form className="space-y-4" onSubmit={handleProfileSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('settings_business_name')}</Label>
              <Input
                value={profileForm.businessName}
                onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                placeholder="Cafetería Ejemplo"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings_email')}</Label>
              <Input
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                type="email"
                placeholder="contacto@cafeteria.es"
                required
              />
            </div>
            {currentUser?.role === "owner" && (
              <div className="space-y-1.5">
                <Label>{t('settings_slug')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">stampee.co/</span>
                  <Input
                    value={profileForm.slug}
                    readOnly
                    className="bg-muted/40 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{t('settings_slug_hint')}</p>
              </div>
            )}
          </div>
          {profileError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {profileSuccess}
            </div>
          )}
          <div>
            <Button type="submit" className="rounded-full px-6" disabled={profileBusy}>
              {profileBusy ? t('settings_saving') : t('settings_save_profile')}
            </Button>
          </div>
        </form>
      </section>

      {/* Change Password */}
      <section className="rounded-2xl md:rounded-3xl border bg-white p-4 md:p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{t('settings_password_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings_password_subtitle')}</p>
        </div>
        <form className="space-y-4" onSubmit={handlePasswordSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('settings_new_password')}</Label>
              <Input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings_confirm_password')}</Label>
              <Input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {passwordError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordSuccess}
            </div>
          )}
          <div>
            <Button type="submit" className="rounded-full px-6" disabled={passwordBusy}>
              {passwordBusy ? t('settings_saving') : t('settings_change_password_btn')}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl md:rounded-3xl border bg-white p-4 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">{t('settings_staff_title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('settings_staff_subtitle')}
            </p>
          </div>
          {currentOwner?.slug && currentOwner?.id && (
            <div className="text-xs text-muted-foreground space-y-2 md:text-right">
              <div>
                {t('settings_org_id')}: <span className="font-mono break-all">{currentOwner.id}</span>
              </div>
              <div className="text-[11px] text-muted-foreground/80">
                {t('settings_org_id_share')}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={buildStaffPortalUrl(currentOwner.slug, currentOwner.id)}
                  className="text-[11px] font-mono bg-muted/40 min-w-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigator.clipboard.writeText(buildStaffPortalUrl(currentOwner.slug!, currentOwner.id))}
                >
                  {t('settings_copy')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t('settings_staff_name')}</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Carlos Barista"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings_staff_email')}</Label>
              <Input
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="carlos@cafeteria.es"
                type="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings_staff_pin')}</Label>
              <Input
                value={form.pin}
                onChange={(event) => setForm({ ...form, pin: event.target.value })}
                placeholder="4-6 dígitos"
                maxLength={6}
                required
              />
            </div>
          </div>
          <Button type="submit" className="rounded-full h-10 px-6 w-full sm:w-auto" disabled={staffBusy}>
            {staffBusy ? t('settings_adding_staff') : t('settings_add_staff_btn')}
          </Button>
        </form>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {staffActionError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {staffActionError}
          </div>
        )}

        {/* Staff table — desktop */}
        <div className="hidden md:block rounded-2xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.4fr_0.8fr_auto] gap-4 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-slate-50">
            <span>{t('settings_staff_name')}</span>
            <span>{t('settings_staff_email')}</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>
          {staffAccounts.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              {t('settings_no_staff')}
            </div>
          ) : (
            staffAccounts.map((staff) => (
              <div
                key={staff.id}
                className="grid grid-cols-[1.2fr_1.4fr_0.8fr_auto] gap-4 px-4 py-4 border-t items-center"
              >
                <div className="font-medium text-foreground truncate">{staff.businessName}</div>
                <div className="text-sm text-muted-foreground truncate">{staff.email}</div>
                <div>
                  <Badge
                    variant={staff.access === "active" ? "secondary" : "destructive"}
                    className="uppercase tracking-wider"
                  >
                    {staff.access === "active" ? t('settings_status_active') : t('settings_status_disabled')}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={staffActionBusyId === staff.id}
                    onClick={() => {
                      setResetTarget({ id: staff.id, name: staff.businessName });
                      setResetPin("");
                      setResetError("");
                    }}
                  >
                    {t('settings_reset_pin')}
                  </Button>
                  <Button
                    variant={staff.access === "active" ? "destructive" : "default"}
                    size="sm"
                    disabled={staffActionBusyId === staff.id}
                    onClick={() =>
                      handleSetStaffAccess(staff.id, staff.access === "active" ? "disabled" : "active")
                    }
                  >
                    {staffActionBusyId === staff.id ? t('settings_saving') : (staff.access === "active" ? t('settings_disable') : t('settings_enable'))}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={staffActionBusyId === staff.id}
                    onClick={() => {
                      setDeleteStaffTarget({ id: staff.id, name: staff.businessName });
                      setDeleteStaffError("");
                    }}
                  >
                    {t('settings_delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Staff list — mobile cards */}
        <div className="md:hidden space-y-3">
          {staffAccounts.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 px-4 py-6 text-sm text-muted-foreground">
              {t('settings_no_staff')}
            </div>
          ) : (
            staffAccounts.map((staff) => (
              <div
                key={staff.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{staff.businessName}</div>
                    <div className="text-sm text-muted-foreground truncate">{staff.email}</div>
                  </div>
                  <Badge
                    variant={staff.access === "active" ? "secondary" : "destructive"}
                    className="uppercase tracking-wider shrink-0"
                  >
                    {staff.access === "active" ? t('settings_status_active') : t('settings_status_disabled')}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={staffActionBusyId === staff.id}
                    onClick={() => {
                      setResetTarget({ id: staff.id, name: staff.businessName });
                      setResetPin("");
                      setResetError("");
                    }}
                  >
                    {t('settings_reset_pin')}
                  </Button>
                  <Button
                    variant={staff.access === "active" ? "destructive" : "default"}
                    size="sm"
                    className="flex-1"
                    disabled={staffActionBusyId === staff.id}
                    onClick={() =>
                      handleSetStaffAccess(staff.id, staff.access === "active" ? "disabled" : "active")
                    }
                  >
                    {staffActionBusyId === staff.id ? t('settings_saving') : (staff.access === "active" ? t('settings_disable') : t('settings_enable'))}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={staffActionBusyId === staff.id}
                    onClick={() => {
                      setDeleteStaffTarget({ id: staff.id, name: staff.businessName });
                      setDeleteStaffError("");
                    }}
                  >
                    {t('settings_delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl md:rounded-3xl border border-rose-200 bg-rose-50 p-4 md:p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-semibold text-rose-900">{t('settings_danger_zone')}</h2>
          <p className="text-sm text-rose-800/90">
            {t('settings_danger_desc')}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-white/70 px-4 py-3 text-xs text-rose-800">
          {t('settings_danger_warn')}
        </div>
        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setDeleteError("");
              setDeleteConfirmText("");
              setIsDeleteStepOneOpen(true);
            }}
          >
            {t('settings_delete_account_btn')}
          </Button>
        </div>
      </section>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && !resetBusy && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer PIN para {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{t('settings_staff_pin')}</Label>
            <Input
              value={resetPin}
              onChange={(event) => setResetPin(event.target.value)}
              placeholder="4-6 dígitos"
              maxLength={6}
            />
            {resetError && (
              <div className="text-sm text-rose-600">{resetError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetBusy}>
              {t('cancel')}
            </Button>
            <Button onClick={handleReset} disabled={resetBusy}>
              {resetBusy ? t('settings_saving') : "Actualizar PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteStaffTarget} onOpenChange={(open) => !open && setDeleteStaffTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cuenta de personal?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esto eliminará permanentemente a <span className="font-semibold text-foreground">{deleteStaffTarget?.name}</span> y revocará su acceso con PIN.
            </p>
            {deleteStaffError && (
              <div className="text-sm text-rose-600">{deleteStaffError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStaffTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff} disabled={deleteStaffBusy}>
              {deleteStaffBusy ? t('settings_saving') : t('settings_delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteStepOneOpen} onOpenChange={(open) => !deleteAccountBusy && setIsDeleteStepOneOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cuenta: Paso 1 de 2</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Estás a punto de eliminar <span className="font-semibold text-foreground">{currentOwner?.businessName}</span>.
            </p>
            <p>Esto eliminará el acceso de propietario, todas las cuentas de camareros, campañas e historial de clientes.</p>
            <p className="text-rose-600 font-medium">Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteStepOneOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDeleteStepOneOpen(false);
                setDeleteError("");
                setDeleteConfirmText("");
                setIsDeleteStepTwoOpen(true);
              }}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteStepTwoOpen}
        onOpenChange={(open) => {
          if (deleteAccountBusy) return;
          setIsDeleteStepTwoOpen(open);
          if (!open) {
            setDeleteConfirmText("");
            setDeleteError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cuenta: Paso 2 de 2</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escribe <span className="font-mono font-semibold text-foreground">{DELETE_CONFIRMATION}</span> para confirmar la eliminación permanente de esta cuenta.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              placeholder={DELETE_CONFIRMATION}
            />
            {deleteError && <div className="text-sm text-rose-600">{deleteError}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteStepTwoOpen(false)} disabled={deleteAccountBusy}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFinal}
              disabled={deleteAccountBusy || deleteConfirmText.trim().toUpperCase() !== DELETE_CONFIRMATION}
            >
              {deleteAccountBusy ? t('settings_saving') : "Eliminar Definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
