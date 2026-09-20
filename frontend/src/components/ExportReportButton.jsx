import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ExportReportButton = ({ expenses, groups, settlements }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    try {
      const { downloadExpenseCSV, downloadExpensePDF } = await import('@/lib/expenseReport');
      if (format === 'pdf') {
        downloadExpensePDF({ expenses, groups, settlements });
      } else {
        downloadExpenseCSV({ expenses, groups, settlements });
      }
      toast.success(`Expense report (${format.toUpperCase()}) downloaded`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to generate the report. Please try again.');
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="border-slate-300 text-slate-700 shadow-sm"
      >
        <Download className="w-4 h-4 text-emerald-600" />
        Export
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-20">
          <p className="px-3 pt-1.5 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Expense Report
          </p>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
            <span>
              <span className="block text-sm font-medium text-slate-900">Download PDF</span>
              <span className="block text-xs text-slate-500">Formatted printable report</span>
            </span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <span className="block text-sm font-medium text-slate-900">Download CSV</span>
              <span className="block text-xs text-slate-500">Open in Excel / Sheets</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportReportButton;