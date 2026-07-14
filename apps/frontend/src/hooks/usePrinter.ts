import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';

/**
 * Hook pour imprimer un ticket ou ouvrir une facture PDF.
 * - En environnement Electron : appel IPC natif (print ou save)
 * - En navigateur web : ouverture dans un onglet
 */
export function usePrinter() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  const printTicket = async (invoiceId: string) => {
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}/ticket`, {
        responseType: 'arraybuffer',
      });

      if (isElectron) {
        const result = await window.electronAPI?.printTicket(response.data);
        if (result?.success) {
          toast.success('Ticket envoyé à l\'imprimante');
        } else {
          toast.error(`Erreur impression: ${result?.error}`);
        }
      } else {
        // Fallback navigateur : ouvrir dans un onglet
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch {
      toast.error('Impossible de générer le ticket');
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'arraybuffer',
      });

      if (isElectron) {
        const result = await window.electronAPI?.savePdf(response.data, `facture-${invoiceNumber}.pdf`);
        if (result?.success) toast.success('Facture enregistrée');
      } else {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoiceNumber}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch {
      toast.error('Impossible de télécharger la facture');
    }
  };

  return { printTicket, downloadInvoice, isElectron };
}
