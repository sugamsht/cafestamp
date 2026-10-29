import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Mail, Phone, Edit, UserPlus } from "lucide-react";
import { Customer } from '../types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { upsertCustomer } from '../lib/db/customers';
import { useAuth } from './AuthProvider';
import { useLanguage } from '../lib/i18n/LanguageContext';

interface CustomerDirectoryProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  readOnly?: boolean;
  refreshData?: () => Promise<void>;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({ customers, setCustomers, readOnly = false, refreshData }) => {
  const { currentOwner } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.mobile && c.mobile.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveEdit = async () => {
    if (!editingCustomer || !currentOwner) return;
    setError("");
    setBusy(true);
    const result = await upsertCustomer(
      { id: editingCustomer.id, name: formData.name, email: formData.email, mobile: formData.mobile, status: editingCustomer.status },
      currentOwner.id
    );
    setBusy(false);
    if (result.ok) {
      if (refreshData) {
        void refreshData();
      } else {
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c));
      }
      setEditingCustomer(null);
    } else {
      setError(result.error ?? "Unable to update this customer right now.");
    }
  };

  const handleAddCustomer = async () => {
    if (!currentOwner) return;
    setError("");
    setBusy(true);
    const newId = `cust-${Date.now()}`;
    const result = await upsertCustomer(
      { id: newId, name: formData.name, email: formData.email, mobile: formData.mobile, status: 'Active' },
      currentOwner.id
    );
    setBusy(false);
    if (result.ok) {
      if (refreshData) {
        void refreshData();
      } else {
        const newCustomer: Customer = {
          id: newId,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          status: 'Active',
          cards: []
        };
        setCustomers(prev => [...prev, newCustomer]);
      }
      setIsAddOpen(false);
      setFormData({ name: '', email: '', mobile: '' });
    } else {
      setError(result.error ?? "Unable to create this customer right now.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-in h-full flex flex-col bg-gray-50/50">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t('customers_title')}</h1>
          <p className="text-muted-foreground">{t('customers_subtitle')}</p>
        </div>
        {!readOnly && (
          <Button onClick={() => { setFormData({ name: '', email: '', mobile: '' }); setIsAddOpen(true); }} className="gap-2 rounded-full shadow-sm w-full sm:w-auto">
            <UserPlus size={16} /> {t('customers_add_btn')}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border w-full max-w-sm shadow-sm">
        <Search className="text-gray-400" size={20} />
        <Input
          className="flex-1 border-none shadow-none focus-visible:ring-0 px-0"
          placeholder={t('customers_search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white flex-1 overflow-auto shadow-sm">
        {/* Mobile cards view */}
        <div className="space-y-3 p-3 md:hidden">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t('customers_empty')}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-border bg-white p-4 shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">{customer.name}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 mt-0.5">
                        {customer.cards.length === 1 ? t('customers_card_single') : t('customers_cards_count', { n: customer.cards.length })}
                      </span>
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full shrink-0"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormData({ name: customer.name, email: customer.email, mobile: customer.mobile || '' });
                      }}
                      title={t('customers_edit_btn')}
                    >
                      <Edit size={14} className="text-muted-foreground" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 border-t border-gray-100 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="shrink-0 text-gray-400" />
                    <span className="truncate">{customer.email || t('customers_no_email')}</span>
                  </div>
                  {customer.mobile ? (
                    <div className="flex items-center gap-2 truncate">
                      <Phone size={13} className="shrink-0 text-gray-400" />
                      <span>{customer.mobile}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 truncate text-muted-foreground/60">
                      <Phone size={13} className="shrink-0 text-gray-400" />
                      <span>{t('customers_no_phone')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>{t('customers_th_customer')}</TableHead>
                <TableHead>{t('customers_th_contact')}</TableHead>
                <TableHead className="text-center">{t('customers_th_cards')}</TableHead>
                <TableHead className="text-right">{t('customers_th_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">{t('customers_empty')}</TableCell></TableRow>
              ) : (
                filteredCustomers.map(customer => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-muted-foreground gap-1">
                        <div className="flex items-center gap-2"><Mail size={12} /> {customer.email || t('customers_no_email')}</div>
                        {customer.mobile ? (
                          <div className="flex items-center gap-2"><Phone size={12} /> {customer.mobile}</div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground/60"><Phone size={12} /> {t('customers_no_phone')}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {customer.cards.length}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingCustomer(customer); setFormData({ name: customer.name, email: customer.email, mobile: customer.mobile || '' }) }}
                          title={t('customers_edit_btn')}
                        >
                          <Edit size={16} className="text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!readOnly && !!editingCustomer} onOpenChange={(o) => !o && !busy && setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('customers_edit_title')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>{t('customers_name_label')}</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>{t('customers_email_label')}</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>{t('customers_mobile_label')}</Label><Input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={busy}>{busy ? t('saving') : t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!readOnly && isAddOpen} onOpenChange={(open) => !busy && setIsAddOpen(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('customers_add_title')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>{t('customers_name_label')}</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>{t('customers_email_label')}</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="grid gap-2"><Label>{t('customers_mobile_label')}</Label><Input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCustomer} disabled={!formData.name || busy}>{busy ? t('saving') : t('customers_add_btn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
