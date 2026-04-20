import React, { useState } from 'react';
import { Download, FileSpreadsheet, Globe, Settings, FileText, TriangleAlert } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type Lang = 'en' | 'ar';
type Tab = 'quotation' | 'settings';

const DICT = {
  en: {
    title: "Investment Proposal",
    subtitlePrep: "Prepared for:",
    ref: "Ref:",
    projectedNet: "Projected Net Total",
    currency: "OMR",
    scenarioLabel: "Scenario",
    totalLabel: "(Total)",
    finAdj: "Financial Adjustment",
    discountPct: "Discount Percentage",
    amountSaved: "Amount Saved",
    netPrice: "Net Proposal Price",
    exportBtn: "Export to Excel",
    downloadBtn: "Download Excel",
    paymentPhase: "Payment Phase",
    milestone: "Milestone",
    percentage: "Percentage",
    amountCol: "Amount",
    downPayment: "Down Payment",
    uponBooking: "Upon Booking",
    handover: "Handover",
    keyHandover: "Key Handover",
    grandTotal: "Grand Total",
    termsTitle: "Terms & Conditions:",
    terms1: "The",
    terms2: "% discount is the maximum authorized limit for this offer. Prices are inclusive of add-ons as specified in",
    validText: "Valid for 7 business days.",
    exQuotation: "Quotation:",
    exUnitsInc: "Units Included",
    exPriceUnit: "Price per Unit",
    exPaymentSch: "Payment Schedule Breakdowns",
    
    settingsUI: "Settings",
    quotationTab: "Quotation View",
    totalPctError: "Total payment percentage must equal exactly 100%. Currently:",
    clientName: "Client Name",
    refNum: "Reference Number",
    unitsInput: "Units Included (Comma separated, e.g. P561, P563)",
    basePriceConfig: "Base Prices Configuration",
    updateBtn: "Done Editing",
    installment: "Installment",
    quarter: "Quarter",
    exTotalUnits: (num: number) => `Total Price (${num} Units)`,
  },
  ar: {
    title: "عرض استثماري",
    subtitlePrep: "أُعد لـ:",
    ref: "المرجع:",
    projectedNet: "إجمالي الصافي المتوقع",
    currency: "ر.ع.",
    scenarioLabel: "سيناريو",
    totalLabel: "(الإجمالي)",
    finAdj: "التسويات المالية",
    discountPct: "نسبة الخصم",
    amountSaved: "المبلغ الموفر",
    netPrice: "صافي سعر العرض",
    exportBtn: "تصدير إلى إكسل",
    downloadBtn: "تنزيل إكسل",
    paymentPhase: "مرحلة الدفع",
    milestone: "الحدث",
    percentage: "النسبة",
    amountCol: "المبلغ",
    downPayment: "الدفعة المقدمة",
    uponBooking: "عند الحجز",
    handover: "التسليم",
    keyHandover: "تسليم المفتاح",
    grandTotal: "المجموع الكلي",
    termsTitle: "الشروط والأحكام:",
    terms1: "خصم",
    terms2: "% هو الحد الأقصى المصرح به لهذا العرض. الأسعار تشمل الإضافات كما هو محدد في",
    validText: "صالح لمدة 7 أيام عمل.",
    exQuotation: "عرض سعر:",
    exUnitsInc: "الوحدات المشمولة",
    exPriceUnit: "سعر الوحدة",
    exPaymentSch: "تفاصيل الدفعات",
    
    settingsUI: "الإعدادات",
    quotationTab: "أداة عرض السعر",
    totalPctError: "يجب أن يكون إجمالي نسبة الدفع 100% بالضبط. المجموع الحالي:",
    clientName: "اسم العميل",
    refNum: "الرقم المرجعي",
    unitsInput: "الوحدات المشمولة (مفصولة بفاصلة، مثال P561, P563)",
    basePriceConfig: "إعدادات الأسعار للسيناريوهات",
    updateBtn: "تم الانتهاء من التعديل",
    installment: "الدفعة",
    quarter: "الربع",
    exTotalUnits: (num: number) => `السعر الإجمالي (${num} وحدات)`,
  }
};

const DEFAULT_SCENARIOS = [
  {
    id: 1,
    name: { en: 'Scenario 1 (Base)', ar: 'السيناريو 1 (الأساسي)' },
    title: { en: 'Base Scenario', ar: 'السيناريو الأساسي' },
    desc: { en: 'Price Per Unit', ar: 'السعر للوحدة الأساسية' },
    price: 70422.0,
  },
  {
    id: 2,
    name: { en: 'Scenario 2 (Standard)', ar: 'السيناريو 2 (القياسي)' },
    title: { en: 'Standard Add-ons', ar: 'إضافات قياسية' },
    desc: { en: 'Includes Kitchen & Split AC', ar: 'يشمل مطبخ وتكييف منفصل' },
    price: 75882.0,
  },
  {
    id: 3,
    name: { en: 'Scenario 3 (Premium)', ar: 'السيناريو 3 (المميز)' },
    title: { en: 'Premium Add-ons', ar: 'إضافات مميزة' },
    desc: { en: 'Includes Ducted AC & Master BR', ar: 'يشمل تكييف مركزي وغرفة نوم رئيسية' },
    price: 76535.975,
  },
];

// Fixed elements: 20% down, 5% handover. Middle 8 = 75%. (75/8 = 9.375)
const DEFAULT_INSTALLMENTS = Array(8).fill("9.375");

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [activeTab, setActiveTab] = useState<Tab>('quotation');

  // Business State
  const [clientName, setClientName] = useState('Mr. Rashid');
  const [refNumber, setRefNumber] = useState('OMN-2024-882');
  const [unitsStr, setUnitsStr] = useState('P561, P563');
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(2);
  const [discount, setDiscount] = useState<number | string>(0);
  const [installments, setInstallments] = useState<string[]>(DEFAULT_INSTALLMENTS);

  const t = DICT[lang];
  const activeScenario = scenarios[activeScenarioIdx];
  const discountVal = typeof discount === 'number' ? discount : (parseFloat(discount as string) || 0);

  const formatOMR = (val: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-OM' : 'en-OM', {
      minimumFractionDigits: 3, maximumFractionDigits: 3,
    }).format(val);

  const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en');

  const unitList = unitsStr.split(',').map(x => x.trim()).filter(Boolean);
  const numUnits = unitList.length || 1;

  const totalPrice = activeScenario.price * numUnits;
  const amountSaved = (totalPrice * discountVal) / 100;
  const netPrice = totalPrice - amountSaved;

  // Percentage Calculations
  const downPaymentPct = 20;
  const handoverPct = 5;
  const installmentsSum = installments.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const totalPctSum = downPaymentPct + installmentsSum + handoverPct;
  const isValidPct = Math.abs(totalPctSum - 100) < 0.001;

  const handleInstallmentChange = (index: number, val: string) => {
    const newInsts = [...installments];
    newInsts[index] = val;
    setInstallments(newInsts);
  };

  const exportToExcel = async () => {
    if (!isValidPct) return; // Guard clause
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Real Estate Dashboard';

    scenarios.forEach((scenario) => {
      const sName = scenario.name[lang];
      const worksheet = workbook.addWorksheet(sName, {
        views: [{ showGridLines: false, rightToLeft: lang === 'ar' }]
      });

      // Spacing and base styling
      worksheet.properties.defaultRowHeight = 24;

      // Define column widths for a balanced document (A for margin, etc.)
      worksheet.getColumn('A').width = 4;  // Left Margin
      worksheet.getColumn('B').width = 48; // Labels
      worksheet.getColumn('C').width = 25; // Values
      worksheet.getColumn('D').width = 4;  // Right Margin

      const theme = {
        primary: 'FF0F172A',   // Slate 900
        gold: 'FFB45309',      // Amber 700
        goldBg: 'FFFFFBEB',    // Amber 50
        lightGray: 'FFF8FAFC', // Slate 50
        border: 'FFE2E8F0',    // Slate 200
        textMain: 'FF334155',  // Slate 700
        textMuted: 'FF64748B'  // Slate 500
      };

      // Helper function to insert a styled section header
      const addSectionHeader = (title: string, startRow: number) => {
        worksheet.mergeCells(`B${startRow}:C${startRow}`);
        const cell = worksheet.getCell(`B${startRow}`);
        cell.value = title.toUpperCase();
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
        cell.alignment = { vertical: 'middle', indent: 1 };
      };

      // Helper function to add a standard data row
      const addDataRow = (r: number, label: string, value: any, isCurrency = false, isBold = false, customBg?: string, customFont?: string) => {
        const rowObj = worksheet.getRow(r);
        rowObj.height = 28;

        const cellL = worksheet.getCell(`B${r}`);
        const cellV = worksheet.getCell(`C${r}`);

        // Label Style
        cellL.value = label;
        cellL.font = { name: 'Segoe UI', size: 11, bold: isBold, color: { argb: customFont || theme.textMain } };
        cellL.alignment = { vertical: 'middle', indent: 1 };
        cellL.border = { bottom: { style: 'thin', color: { argb: theme.border } } };

        // Value Style
        if (value !== undefined) {
          cellV.value = value;
          cellV.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: customFont || theme.primary } };
          cellV.alignment = { vertical: 'middle', horizontal: lang === 'ar' ? 'left' : 'right' };
          cellV.border = { bottom: { style: 'thin', color: { argb: theme.border } } };

          if (isCurrency) {
            cellV.numFmt = `#,##0.000 "${t.currency}"`;
          } else if (typeof value === 'number') {
            cellV.numFmt = '0.00%';
          }
        }

        // Custom fill if provided
        if (customBg) {
          cellL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: customBg } };
          cellV.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: customBg } };
        }

        return `C${r}`;
      };

      // --- HEADER ---
      // Brand Title
      worksheet.mergeCells('B2:C2');
      const titleCell = worksheet.getCell('B2');
      titleCell.value = t.title.toUpperCase();
      titleCell.font = { name: 'Segoe UI', size: 22, bold: true, color: { argb: theme.primary } };
      titleCell.alignment = { vertical: 'middle', horizontal: lang === 'ar' ? 'right' : 'left' };

      // Subtitle (Client & Reference)
      worksheet.mergeCells('B3:C3');
      const subCell = worksheet.getCell('B3');
      subCell.value = `${t.subtitlePrep} ${clientName}  |  ${t.ref} ${refNumber}`;
      subCell.font = { name: 'Segoe UI', size: 11, color: { argb: theme.textMuted }, italic: true };
      subCell.alignment = { vertical: 'middle', horizontal: lang === 'ar' ? 'right' : 'left' };

      // Solid color divider line
      worksheet.mergeCells('B4:C4');
      worksheet.getCell('B4').border = { bottom: { style: 'medium', color: { argb: theme.gold } } };

      let r = 6;

      // --- QUOTATION DETAILS ---
      addSectionHeader(`${t.exQuotation} ${sName}`, r++);
      
      addDataRow(r++, t.exUnitsInc, unitList.join(' & '), false, true);
      addDataRow(r++, scenario.title[lang], scenario.desc[lang], false);
      
      const priceUnitCell = addDataRow(r++, t.exPriceUnit, scenario.price, true);
      r++; // gap

      // --- FINANCIAL BREAKDOWN ---
      addSectionHeader(t.finAdj, r++);
      
      const totalCell = addDataRow(r++, t.exTotalUnits(numUnits), { formula: `=${priceUnitCell}*${numUnits}`, result: scenario.price * numUnits }, true);
      
      const discountCell = addDataRow(r++, t.discountPct, discountVal / 100, false, false, theme.goldBg, theme.gold);
      
      const savedCell = addDataRow(r++, t.amountSaved, { formula: `=${totalCell}*${discountCell}`, result: scenario.price * numUnits * (discountVal / 100) }, true);

      // Hero row for Net Proposal Price
      const netRowObj = worksheet.getRow(r);
      netRowObj.height = 36;
      
      const netLabel = worksheet.getCell(`B${r}`);
      netLabel.value = t.netPrice.toUpperCase();
      netLabel.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      netLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
      netLabel.alignment = { vertical: 'middle', indent: 1 };
      
      const netValue = worksheet.getCell(`C${r}`);
      netValue.value = { formula: `=${totalCell}-${savedCell}`, result: scenario.price * numUnits - (scenario.price * numUnits * (discountVal / 100)) };
      netValue.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: theme.gold } };
      netValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
      netValue.alignment = { vertical: 'middle', horizontal: lang === 'ar' ? 'left' : 'right' };
      netValue.numFmt = `#,##0.000 "${t.currency}"`;
      
      const netPriceCell = `C${r}`;
      r += 2; // gap

      // --- PAYMENT SCHEDULE ---
      addSectionHeader(t.exPaymentSch, r++);
      
      addDataRow(r++, `${t.downPayment} (${downPaymentPct}%)`, { formula: `=${netPriceCell}*${downPaymentPct/100}` }, true, false, theme.lightGray);
      
      installments.forEach((strVal, i) => {
        const pct = parseFloat(strVal) || 0;
        addDataRow(r++, `${t.installment} ${i+1} - ${t.quarter} ${i+1} (${pct}%)`, { formula: `=${netPriceCell}*${pct/100}` }, true);
      });

      addDataRow(r++, `${t.handover} (${handoverPct}%)`, { formula: `=${netPriceCell}*${handoverPct/100}` }, true, false, theme.lightGray);

      r += 2;

      // --- FOOTER TERMS ---
      worksheet.mergeCells(`B${r}:C${r+2}`);
      const footerCell = worksheet.getCell(`B${r}`);
      footerCell.value = `${t.termsTitle}\n${t.terms1} ${discountVal}${t.terms2} ${sName}. ${t.validText}`;
      footerCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: theme.textMuted } };
      footerCell.alignment = { wrapText: true, vertical: 'top', horizontal: lang === 'ar' ? 'right' : 'left' };

    });

    workbook.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: activeScenarioIdx, visibility: 'visible' }];
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Investment_Proposal.xlsx');
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-slate-50 pt-5 pb-0 shrink-0 border-b-4 border-amber-700">
        <div className="px-8 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="m-0 text-xl tracking-tight font-bold">{t.title}{unitList.length > 0 ? `: ${unitList.join(' & ')}` : ''}</h1>
            <p className="mt-1 opacity-60 text-xs">{t.subtitlePrep} {clientName} | {t.ref} {refNumber}</p>
          </div>
          <div className="text-start sm:text-end flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={toggleLang} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors focus:ring-2 focus:ring-amber-500">
                <Globe size={14} />
                {lang === 'ar' ? 'English' : 'عربي'}
              </button>
            </div>
            {activeTab === 'quotation' && (
              <>
                <div className="text-2xl font-bold text-slate-50">
                  <span className="text-amber-700">{t.currency}</span> {formatOMR(netPrice)}
                </div>
                <div className="text-[11px] uppercase tracking-widest opacity-80">{t.projectedNet}</div>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 flex gap-6 mt-2 relative top-[4px]">
          <button 
            onClick={() => setActiveTab('quotation')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-4 transition-colors ${activeTab === 'quotation' ? 'border-amber-700 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <FileText size={16}/> {t.quotationTab}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-4 transition-colors ${activeTab === 'settings' ? 'border-amber-700 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Settings size={16}/> {t.settingsUI}
          </button>
        </div>
      </header>

      {/* Settings View */}
      {activeTab === 'settings' && (
        <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">{t.settingsUI}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.clientName}</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.refNum}</label>
                <input type="text" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t.unitsInput}</label>
                <input type="text" value={unitsStr} onChange={(e) => setUnitsStr(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">{t.basePriceConfig}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((scen, idx) => (
                  <div key={scen.id} className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
                    <label className="block text-xs font-bold text-slate-700 mb-2">{scen.title[lang]}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" value={scen.price} 
                        onChange={(e) => {
                          const newS = [...scenarios];
                          newS[idx].price = Number(e.target.value) || 0;
                          setScenarios(newS);
                        }} 
                        className="w-full bg-white border border-slate-300 p-2 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono" 
                      />
                      <span className="text-xs text-slate-500 font-bold">{t.currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button onClick={() => setActiveTab('quotation')} className="bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-amber-800 transition-colors">
                {t.updateBtn}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Quotation View */}
      {activeTab === 'quotation' && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8 py-6 shrink-0 animate-in fade-in duration-300">
          {scenarios.map((scenario, idx) => (
            <div key={scenario.id} onClick={() => setActiveScenarioIdx(idx)} className={`cursor-pointer transition-all bg-white border rounded-lg p-4 shadow-sm relative ${activeScenarioIdx === idx ? 'border-2 border-amber-700 bg-amber-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
              <span className={`absolute top-3 end-3 text-[10px] uppercase px-2 py-0.5 rounded font-bold ${activeScenarioIdx === idx ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {t.scenarioLabel} {idx + 1}
              </span>
              <h3 className="m-0 mb-2 text-sm text-slate-500 font-semibold">{scenario.title[lang]}</h3>
              <div className={`text-lg font-bold ${activeScenarioIdx === idx ? 'text-amber-700' : 'text-slate-800'}`}>
                {formatOMR(scenario.price)} {t.currency}
              </div>
              <div className="text-xs mt-1 text-slate-400">{scenario.desc[lang]}</div>
              <div className={`mt-3 pt-3 border-t border-dashed border-slate-200 font-semibold ${activeScenarioIdx === idx ? 'text-amber-700' : 'text-slate-800'}`}>
                {formatOMR(scenario.price * numUnits)} {t.currency} <span className="text-[10px] font-normal text-slate-600">{t.totalLabel}</span>
              </div>
            </div>
          ))}
        </div>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 px-8 pb-6 w-full max-w-7xl mx-auto items-start animate-in fade-in duration-300">
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-5">
            <h4 className="m-0 mb-4 uppercase text-[11px] tracking-[0.05em] text-slate-500 font-bold">{t.finAdj}</h4>
            <div className="mb-5">
              <label className="block text-xs mb-2 font-semibold text-slate-700">{t.discountPct}</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bg-white border focus:outline-none focus:ring-2 ring-amber-700/20 border-amber-700 text-amber-700 p-2 rounded w-[80px] font-bold text-center" />
                <span className="font-bold text-slate-700">%</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-md mb-3 shadow-sm border border-slate-200/60">
              <div className="text-[11px] text-slate-500 font-semibold mb-0.5">{t.amountSaved}</div>
              <div className="text-base font-bold text-emerald-600">- {formatOMR(amountSaved)} {t.currency}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm border border-slate-200/60 mb-5 relative overflow-hidden">
              <div className="absolute start-0 top-0 bottom-0 w-1 bg-slate-800"></div>
              <div className="text-[11px] text-slate-500 font-semibold mb-0.5 ms-2">{t.netPrice}</div>
              <div className="text-base font-bold text-slate-900 ms-2">{formatOMR(netPrice)} {t.currency}</div>
            </div>
            <button
              onClick={exportToExcel}
              disabled={!isValidPct}
              className={`hidden sm:flex transition-colors text-white px-4 py-2.5 rounded font-semibold text-xs items-center gap-2 w-full justify-center mt-2 shadow-sm ${isValidPct ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400 cursor-not-allowed'}`}
            >
              <FileSpreadsheet size={16} className={isValidPct ? 'text-emerald-400' : 'text-slate-300'} /> {t.exportBtn}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead>
                  <tr>
                    <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.paymentPhase}</th>
                    <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.milestone}</th>
                    <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.percentage}</th>
                    <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.amountCol} ({t.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 text-slate-700 text-start">{t.downPayment}</td>
                    <td className="px-4 py-3 text-slate-500 text-start">{t.uponBooking}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 text-start">{downPaymentPct}%</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-start">{formatOMR(netPrice * (downPaymentPct/100))}</td>
                  </tr>
                  
                  {installments.map((valStr, i) => {
                    const parsed = parseFloat(valStr) || 0;
                    return (
                      <tr key={i} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 text-slate-700 text-start">{t.installment} {i+1}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-start">{t.quarter} {i+1}</td>
                        <td className="px-4 py-2.5 text-slate-600 text-start">
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" step="0.1" value={installments[i]}
                              onChange={(e) => handleInstallmentChange(i, e.target.value)}
                              className={`w-20 px-2 py-1 border rounded font-mono text-sm focus:outline-none focus:ring-2 ${!isValidPct ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-amber-500 bg-white'}`}
                            />
                            <span className="text-slate-500">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600 text-start">{formatOMR(netPrice * (parsed/100))}</td>
                      </tr>
                    );
                  })}

                  <tr>
                    <td className="px-4 py-3 text-slate-700 text-start">{t.handover}</td>
                    <td className="px-4 py-3 text-slate-500 text-start">{t.keyHandover}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 text-start">{handoverPct}%</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-start">{formatOMR(netPrice * (handoverPct/100))}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td colSpan={2} className="px-4 py-3 text-slate-800 text-start">{t.grandTotal}</td>
                    <td className={`px-4 py-3 text-start ${isValidPct ? 'text-emerald-600' : 'text-red-600'}`}>{totalPctSum}%</td>
                    <td className="px-4 py-3 font-mono text-amber-700 text-start">{formatOMR(netPrice)}</td>
                  </tr>
                </tbody>
              </table>

              {!isValidPct && (
                <div className="p-3 m-4 mb-0 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold flex flex-wrap items-center gap-2">
                  <TriangleAlert size={14} /> {t.totalPctError} {totalPctSum.toFixed(3)}%
                </div>
              )}
            </div>
            <div className="p-4 bg-white text-xs text-slate-500 flex flex-wrap gap-6 border-t border-slate-100 mt-auto">
              {unitList.map(unit => (
                <div key={unit} className="flex gap-1.5 items-center">
                  <strong className="text-slate-700">{unit}:</strong> 
                  <span className="font-mono">{formatOMR(netPrice / numUnits)}</span> {t.currency}
                </div>
              ))}
            </div>
          </div>
        </main>
      </>
      )}

      <footer className="text-[11px] text-slate-500 py-4 px-8 bg-white border-t border-slate-200 shrink-0 mt-auto">
        <strong className="text-slate-700">{t.termsTitle}</strong> {t.terms1} {discountVal}{t.terms2} {activeScenario.name[lang]}. {t.validText}
      </footer>
    </div>
  );
}
