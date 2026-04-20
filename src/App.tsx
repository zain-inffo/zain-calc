import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Globe, Settings, FileText, TriangleAlert } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';

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
    isBeneficiaryLabel: "Housing Ministry Beneficiary (10% Support)",
    housingSupport: "Housing Ministry Support",
    clientType: "Client Type",
    standardClient: "Standard Client",
    beneficiaryClient: "Beneficiary (Housing Ministry)",

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
    paymentPlanSettings: "Payment Plan Settings",
    freqMonthly: "Monthly",
    freqQuarterly: "Quarterly",
    countInstallments: "Number of Installments",
    paymentFreqLabel: "Payment Frequency",
    downPaymentShort: "Down Payment",
    handoverShort: "Handover",
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
    isBeneficiaryLabel: "عميل مستحق (دعم وزارة الإسكان 10%)",
    housingSupport: "دعم وزارة الإسكان",
    clientType: "نوع العميل",
    standardClient: "عميل عادي",
    beneficiaryClient: "عميل مستحق (دعم الإسكان)",

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
    paymentPlanSettings: "إعدادات خطة الدفع",
    freqMonthly: "شهري",
    freqQuarterly: "ربع سنوي",
    countInstallments: "عدد الأقساط",
    paymentFreqLabel: "تكرار الدفع",
    downPaymentShort: "المقدم",
    handoverShort: "الاستلام",
  }
};

const VILLA_DATA = {
  Q: { name: 'Villa Type Q', basePriceOmani: 70422.0, basePriceForeigner: 75000.0, cabinetSize: '3600x3900 mm', cabinetPrice: 1885.0 },
  P: { name: 'Villa Type P', basePriceOmani: 70422.0, basePriceForeigner: 75000.0, cabinetSize: '3600x3900 mm', cabinetPrice: 1885.0 },
  O: { name: 'Villa Type O', basePriceOmani: 70422.0, basePriceForeigner: 75000.0, cabinetSize: '3800x3800 mm', cabinetPrice: 1937.0 },
};

const ADDON_PRICES = {
  appliances: 1606.800,
  ac: {
    Q: { split: 2697.500, advanced: 4179.500 },
    P: { split: 1709.500, advanced: 2489.500 },
    O: { split: 1443.000, advanced: 2196.500 },
  }
};

// Default: 8 total payments (1 Down, 6 Periodic, 1 Handover)
const DEFAULT_PERIODIC_COUNT = 6;
const DEFAULT_INSTALLMENTS = Array(DEFAULT_PERIODIC_COUNT).fill((75 / DEFAULT_PERIODIC_COUNT).toFixed(3));

export default function App() {
  // Persistence Helper
  const getSaved = (key: string, def: any) => {
    const saved = localStorage.getItem(`realestate_${key}`);
    if (saved === null) return def;
    try { return JSON.parse(saved); } catch { return saved; }
  };

  const [lang, setLang] = useState<Lang>(() => getSaved('lang', 'ar'));
  const [activeTab, setActiveTab] = useState<Tab>('quotation');

  // Business State
  const [clientName, setClientName] = useState(() => getSaved('clientName', 'Mr. Rashid'));
  const [refNumber, setRefNumber] = useState(() => getSaved('refNumber', 'OMN-2024-882'));
  const [unitsStr, setUnitsStr] = useState(() => getSaved('unitsStr', 'P561, P563'));
  const [villaConfigs, setVillaConfigs] = useState(() => getSaved('villaConfigs', VILLA_DATA));
  const [discount, setDiscount] = useState<number | string>(() => getSaved('discount', 0));
  
  // Payment Plan State
  const [downPaymentPct, setDownPaymentPct] = useState(() => getSaved('downPaymentPct', 20));
  const [handoverPct, setHandoverPct] = useState(() => getSaved('handoverPct', 5));
  const [numInstallments, setNumInstallments] = useState(() => getSaved('numInstallments', 8));
  const [paymentFreq, setPaymentFreq] = useState<'monthly' | 'quarterly'>(() => getSaved('paymentFreq', 'quarterly'));
  const [installments, setInstallments] = useState<string[]>(() => getSaved('installments', DEFAULT_INSTALLMENTS));

  // Dynamic Configurator State
  const [villaType, setVillaType] = useState<keyof typeof VILLA_DATA>(() => getSaved('villaType', 'Q'));
  const [hasCabinets, setHasCabinets] = useState(() => getSaved('hasCabinets', false));
  const [hasAppliances, setHasAppliances] = useState(() => getSaved('hasAppliances', false));
  const [acType, setAcType] = useState<'none' | 'split' | 'advanced'>(() => getSaved('acType', 'none'));
  const [clientCategory, setClientCategory] = useState<'omani_beneficiary' | 'omani_non_beneficiary' | 'foreigner'>(() => getSaved('clientCategory', 'omani_non_beneficiary'));

  const [currency, setCurrency] = useState<'OMR' | 'USD' | 'AED'>(() => getSaved('currency', 'OMR'));

  // Persistence Effect
  useEffect(() => {
    const state = {
      lang, clientName, refNumber, unitsStr, villaConfigs, discount,
      downPaymentPct, handoverPct, numInstallments, paymentFreq,
      installments, villaType, hasCabinets, hasAppliances, acType,
      clientCategory, currency
    };
    Object.entries(state).forEach(([key, val]) => {
      localStorage.setItem(`realestate_${key}`, JSON.stringify(val));
    });
  }, [
    lang, clientName, refNumber, unitsStr, villaConfigs, discount,
    downPaymentPct, handoverPct, numInstallments, paymentFreq,
    installments, villaType, hasCabinets, hasAppliances, acType,
    clientCategory, currency
  ]);

  const CURRENCY_RATES = {
    OMR: 1,
    USD: 2.597,
    AED: 9.54,
  };

  const t = DICT[lang];
  
  // Calculate dynamic base price
  const activeVilla = villaConfigs[villaType];
  const isForeigner = clientCategory === 'foreigner';
  const basePricePerUnit = isForeigner ? activeVilla.basePriceForeigner : activeVilla.basePriceOmani;
  
  const cabinetCost = hasCabinets ? activeVilla.cabinetPrice : 0;
  const appliancesCost = hasAppliances ? ADDON_PRICES.appliances : 0;
  const acCost = acType === 'none' ? 0 : ADDON_PRICES.ac[villaType][acType as 'split' | 'advanced'];
  
  const currentUnitPrice = basePricePerUnit + cabinetCost + appliancesCost + acCost;
  const discountVal = typeof discount === 'number' ? discount : (parseFloat(discount as string) || 0);

  const isBeneficiary = clientCategory === 'omani_beneficiary';

  // Sync installments when number changes
  useEffect(() => {
    const periodicCount = Math.max(0, numInstallments - 2);
    if (installments.length !== periodicCount) {
      const remaining = 100 - downPaymentPct - handoverPct;
      const each = periodicCount > 0 ? (remaining / periodicCount).toFixed(3) : "0";
      setInstallments(Array(periodicCount).fill(each));
    }
  }, [numInstallments, downPaymentPct, handoverPct]);

  const formatPrice = (val: number) => {
    const converted = val * CURRENCY_RATES[currency];
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency === 'OMR' ? 3 : 2,
      maximumFractionDigits: currency === 'OMR' ? 3 : 2,
    }).format(converted);
  };

  const formatOMR = (val: number) =>
    new Intl.NumberFormat('en-OM', {
      minimumFractionDigits: 3, maximumFractionDigits: 3,
    }).format(val);

  // Animated Number Helper
  const AnimatedNumber = ({ value }: { value: number }) => {
    return <span>{formatPrice(value)}</span>;
  };

  // Simple SVG Pie Chart Component
  const PaymentChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    let cumulativePercent = 0;
    
    function getCoordinatesForPercent(percent: number) {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    }

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mx-auto mb-4">
          <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
            {data.map((slice, i) => {
              const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
              cumulativePercent += slice.value / 100;
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              const largeArcFlag = slice.value / 100 > 0.5 ? 1 : 0;
              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L 0 0`,
              ].join(' ');
              return (
                <path 
                  key={i} 
                  d={pathData} 
                  fill={slice.color} 
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer" 
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg border border-white/50">
              <span className="text-[10px] text-slate-500 font-bold uppercase text-center leading-tight px-2">{t.projectedNet}</span>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="w-full space-y-2 mt-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-600">{item.label}</span>
              </div>
              <span className="text-slate-900">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en');

  const unitList = unitsStr.split(',').map(x => x.trim()).filter(Boolean);
  const numUnits = unitList.length || 1;

  const totalPrice = currentUnitPrice * numUnits;
  const amountSaved = (totalPrice * discountVal) / 100;
  const housingSupportAmount = isBeneficiary ? (totalPrice * 0.1) : 0;
  const netPrice = totalPrice - amountSaved - housingSupportAmount;

  // Percentage Calculations
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

    (['Q', 'P', 'O'] as const).forEach((vType) => {
      const villa = villaConfigs[vType];
      const sName = villa.name;
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
      
      const vAcCost = acType === 'none' ? 0 : ADDON_PRICES.ac[vType][acType as 'split' | 'advanced'];
      const vUnitPrice = villa.basePrice + (hasCabinets ? villa.cabinetPrice : 0) + (hasAppliances ? ADDON_PRICES.appliances : 0) + vAcCost;

      addDataRow(r++, t.exPriceUnit, vUnitPrice, true);
      r++; // gap

      // --- FINANCIAL BREAKDOWN ---
      addSectionHeader(t.finAdj, r++);

      const totalCell = addDataRow(r++, t.exTotalUnits(numUnits), { formula: `=C${r-2}*${numUnits}`, result: vUnitPrice * numUnits }, true);

      const discountCell = addDataRow(r++, t.discountPct, discountVal / 100, false, false, theme.goldBg, theme.gold);
      const savedCell = addDataRow(r++, t.amountSaved, { formula: `=${totalCell}*${discountCell}`, result: scenario.price * numUnits * (discountVal / 100) }, true);

      let totalDeductionsFormula = `=${savedCell}`;
      let totalDeductionsValue = scenario.price * numUnits * (discountVal / 100);

      if (isBeneficiary) {
        const supportCell = addDataRow(r++, t.housingSupport, { formula: `=${totalCell}*0.1`, result: scenario.price * numUnits * 0.1 }, true, false, 'FFF0F9FF', 'FF0369A1');
        totalDeductionsFormula += `+${supportCell}`;
        totalDeductionsValue += scenario.price * numUnits * 0.1;
      }

      // Hero row for Net Proposal Price
      const netRowObj = worksheet.getRow(r);
      netRowObj.height = 36;

      const netLabel = worksheet.getCell(`B${r}`);
      netLabel.value = t.netPrice.toUpperCase();
      netLabel.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      netLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
      netLabel.alignment = { vertical: 'middle', indent: 1 };

      const netValue = worksheet.getCell(`C${r}`);
      netValue.value = { formula: `=${totalPriceCell}-(${totalDeductionsFormula})`, result: scenario.price * numUnits - totalDeductionsValue };
      netValue.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: theme.gold } };
      netValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.primary } };
      netValue.alignment = { vertical: 'middle', horizontal: lang === 'ar' ? 'left' : 'right' };
      netValue.numFmt = `#,##0.000 "${t.currency}"`;

      const netPriceCell = `C${r}`;
      r += 2; // gap

      // --- PAYMENT SCHEDULE ---
      addSectionHeader(t.exPaymentSch, r++);

      addDataRow(r++, `${t.downPayment} (${downPaymentPct}%)`, { formula: `=${netPriceCell}*${downPaymentPct / 100}` }, true, false, theme.lightGray);

      installments.forEach((strVal, i) => {
        const pct = parseFloat(strVal) || 0;
        const freqLabel = paymentFreq === 'monthly' ? t.freqMonthly : t.freqQuarterly;
        // Periodic installments start from Payment 2
        addDataRow(r++, `${t.installment} ${i + 1} (${pct}%)`, { formula: `=${netPriceCell}*${pct / 100}` }, true);
      });

      addDataRow(r++, `${t.handover} (${handoverPct}%)`, { formula: `=${netPriceCell}*${handoverPct / 100}` }, true, false, theme.lightGray);

      r += 2;

      // --- FOOTER TERMS ---
      worksheet.mergeCells(`B${r}:C${r + 2}`);
      const footerCell = worksheet.getCell(`B${r}`);
      footerCell.value = `${t.termsTitle}\n${t.terms1} ${discountVal}${t.terms2} ${sName}. ${t.validText}`;
      footerCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: theme.textMuted } };
      footerCell.alignment = { wrapText: true, vertical: 'top', horizontal: lang === 'ar' ? 'right' : 'left' };

    });

    workbook.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: (['Q', 'P', 'O'] as const).indexOf(villaType), visibility: 'visible' }];
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
            <div className="flex items-center gap-2 mb-2">
              {/* Currency Selector */}
              <div className="flex bg-slate-800 p-1 rounded-lg mr-2">
                {(['OMR', 'USD', 'AED'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${currency === curr ? 'bg-amber-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <button onClick={toggleLang} className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors focus:ring-2 focus:ring-amber-500">
                <Globe size={14} />
                {lang === 'ar' ? 'English' : 'عربي'}
              </button>
            </div>
            {activeTab === 'quotation' && (
              <>
                <div className="text-2xl font-bold text-slate-50 flex items-baseline gap-2">
                  <span className="text-amber-700 text-sm uppercase">{currency}</span> 
                  <AnimatedNumber value={netPrice * CURRENCY_RATES[currency]} />
                </div>
                <div className="text-[11px] uppercase tracking-widest opacity-80">{t.projectedNet}</div>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation + PDF Button */}
        <div className="px-8 flex justify-between items-center mt-2 relative top-[4px]">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('quotation')}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-4 transition-colors ${activeTab === 'quotation' ? 'border-amber-700 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <FileText size={16} /> {t.quotationTab}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-4 transition-colors ${activeTab === 'settings' ? 'border-amber-700 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Settings size={16} /> {t.settingsUI}
            </button>
          </div>

          {activeTab === 'quotation' && (
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 pb-3 px-3 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Download size={16}/> {lang === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}
            </button>
          )}
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
              <div className="md:col-span-2 pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">{t.clientType}</label>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setClientCategory('omani_beneficiary')}
                    className={`flex-1 min-w-[140px] p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-bold ${clientCategory === 'omani_beneficiary' ? 'border-amber-700 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {lang === 'ar' ? 'عماني مستحق' : 'Omani Beneficiary'}
                  </button>
                  <button 
                    onClick={() => setClientCategory('omani_non_beneficiary')}
                    className={`flex-1 min-w-[140px] p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-bold ${clientCategory === 'omani_non_beneficiary' ? 'border-amber-700 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {lang === 'ar' ? 'عماني غير مستحق' : 'Omani Standard'}
                  </button>
                  <button 
                    onClick={() => setClientCategory('foreigner')}
                    className={`flex-1 min-w-[140px] p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-bold ${clientCategory === 'foreigner' ? 'border-amber-700 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {lang === 'ar' ? 'أجنبي' : 'Foreigner'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">{lang === 'ar' ? 'إعدادات الأسعار (عماني / أجنبي)' : 'Price Settings (Omani / Foreigner)'}</h3>
              <div className="grid grid-cols-1 gap-4">
                {(['Q', 'P', 'O'] as const).map((vKey) => (
                  <div key={vKey} className="bg-slate-50 p-4 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="font-black text-slate-700">{villaConfigs[vKey].name}</div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'سعر العماني' : 'Omani Price'}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" value={villaConfigs[vKey].basePriceOmani}
                          onChange={(e) => {
                            const newVal = Number(e.target.value) || 0;
                            setVillaConfigs(prev => ({
                              ...prev,
                              [vKey]: { ...prev[vKey], basePriceOmani: newVal }
                            }));
                          }}
                          className="w-full bg-white border border-slate-300 p-2 rounded focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{lang === 'ar' ? 'سعر الأجنبي' : 'Foreigner Price'}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" value={villaConfigs[vKey].basePriceForeigner}
                          onChange={(e) => {
                            const newVal = Number(e.target.value) || 0;
                            setVillaConfigs(prev => ({
                              ...prev,
                              [vKey]: { ...prev[vKey], basePriceForeigner: newVal }
                            }));
                          }}
                          className="w-full bg-white border border-slate-300 p-2 rounded focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">{t.paymentPlanSettings}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.downPaymentShort} (%)</label>
                  <input type="number" value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.handoverShort} (%)</label>
                  <input type="number" value={handoverPct} onChange={(e) => setHandoverPct(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'إجمالي عدد الدفعات (بما في ذلك المقدم والاستلام)' : 'Total Number of Payments (Inc. Down & Handover)'}</label>
                  <input type="number" min="2" value={numInstallments} onChange={(e) => setNumInstallments(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.paymentFreqLabel}</label>
                  <select 
                    value={paymentFreq} 
                    onChange={(e) => setPaymentFreq(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="monthly">{t.freqMonthly}</option>
                    <option value="quarterly">{t.freqQuarterly}</option>
                  </select>
                </div>
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
      {/* Dynamic Configurator */}
      {activeTab === 'quotation' && (
        <div className="px-8 py-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Villa Selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{lang === 'ar' ? 'نوع الفيلا' : 'Villa Type'}</label>
              <div className="flex flex-col gap-2">
                {(['Q', 'P', 'O'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setVillaType(type)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${villaType === type ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-md scale-[1.02]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-black text-lg">{lang === 'ar' ? `فيلا النوع ${type}` : `Villa ${type}`}</span>
                      <span className="text-[10px] opacity-60 font-bold">{VILLA_DATA[type].cabinetSize}</span>
                    </div>
                    {villaType === type && <div className="w-2 h-2 rounded-full bg-amber-700"></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Kitchen Add-ons */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{lang === 'ar' ? 'إضافات المطبخ' : 'Kitchen Add-ons'}</label>
              <div className="space-y-3">
                <button 
                  onClick={() => setHasCabinets(!hasCabinets)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${hasCabinets ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">{lang === 'ar' ? 'خزائن المطبخ' : 'Cabinets'}</span>
                    <span className="text-[10px] font-mono opacity-80">{formatPrice(VILLA_DATA[villaType].cabinetPrice)} {currency}</span>
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${hasCabinets ? 'border-amber-700 bg-amber-700' : 'border-slate-200'}`}>
                    {hasCabinets && <div className="w-2 h-0.5 bg-white rotate-45 translate-x-[-1px]"></div>}
                    {hasCabinets && <div className="w-3 h-0.5 bg-white -rotate-45 translate-x-[-3px] translate-y-[1px]"></div>}
                  </div>
                </button>

                <button 
                  onClick={() => setHasAppliances(!hasAppliances)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${hasAppliances ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">{lang === 'ar' ? 'أجهزة المطبخ (7 قطع)' : 'Appliances (7 Pcs)'}</span>
                    <span className="text-[10px] font-mono opacity-80">{formatPrice(ADDON_PRICES.appliances)} {currency}</span>
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${hasAppliances ? 'border-amber-700 bg-amber-700' : 'border-slate-200'}`}>
                    {hasAppliances && <div className="w-2 h-0.5 bg-white rotate-45 translate-x-[-1px]"></div>}
                    {hasAppliances && <div className="w-3 h-0.5 bg-white -rotate-45 translate-x-[-3px] translate-y-[1px]"></div>}
                  </div>
                </button>
              </div>
            </div>

            {/* AC Configurator */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{lang === 'ar' ? 'نظام التكييف' : 'AC System'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => setAcType('none')}
                  className={`p-3 rounded-lg border-2 transition-all text-start ${acType === 'none' ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-md scale-[1.02]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <span className="block font-black text-sm uppercase">{lang === 'ar' ? 'بدون' : 'None'}</span>
                  <span className="text-[10px] opacity-60">{lang === 'ar' ? 'تكييف أساسي' : 'Standard Basic'}</span>
                </button>
                <button 
                  onClick={() => setAcType('split')}
                  className={`p-3 rounded-lg border-2 transition-all text-start ${acType === 'split' ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-md scale-[1.02]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <span className="block font-black text-sm uppercase">{lang === 'ar' ? 'جداري (Split)' : 'Split AC'}</span>
                  <span className="text-[10px] font-mono block mt-1">+{formatPrice(ADDON_PRICES.ac[villaType].split)}</span>
                </button>
                <button 
                  onClick={() => setAcType('advanced')}
                  className={`p-3 rounded-lg border-2 transition-all text-start ${acType === 'advanced' ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-md scale-[1.02]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                >
                  <span className="block font-black text-sm uppercase">{lang === 'ar' ? 'متطور (Mixed)' : 'Advanced'}</span>
                  <span className="text-[10px] font-mono block mt-1">+{formatPrice(ADDON_PRICES.ac[villaType].advanced)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 px-8 pb-6 w-full max-w-7xl mx-auto items-start animate-in fade-in duration-300">
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-5">
              <h4 className="m-0 mb-4 uppercase text-[11px] tracking-[0.05em] text-slate-500 font-bold">{t.finAdj}</h4>
              
              {/* Payment Chart */}
              <PaymentChart 
                data={[
                  { label: t.downPayment, value: downPaymentPct, color: '#0f172a' },
                  { label: t.installment, value: installmentsSum, color: '#b45309' },
                  { label: t.handover, value: handoverPct, color: '#ec4899' },
                ]}
              />

              <div className="mb-5 px-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-700">{t.discountPct}</label>
                  <span className="text-sm font-bold text-amber-700">{discount}%</span>
                </div>
                <input 
                  type="range" min="0" max="15" step="0.5" 
                  value={discount} 
                  onChange={(e) => setDiscount(e.target.value)} 
                  className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-amber-700" 
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold">
                  <span>0%</span>
                  <span>15% Max</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-md mb-3 shadow-sm border border-slate-200/60">
                <div className="text-[11px] text-slate-500 font-semibold mb-0.5">{t.amountSaved}</div>
                <div className="text-base font-bold text-emerald-600">
                  - <AnimatedNumber value={amountSaved} /> {currency}
                </div>
              </div>

              {isBeneficiary && (
                <div className="bg-sky-50 p-3 rounded-md mb-3 shadow-sm border border-sky-200 relative overflow-hidden animate-in slide-in-from-right-2">
                  <div className="absolute top-0 end-0 bg-sky-200 text-sky-700 text-[8px] font-black px-1.5 py-0.5 rounded-bl uppercase">10% OFF</div>
                  <div className="text-[11px] text-sky-600 font-bold mb-0.5">{t.housingSupport}</div>
                  <div className="text-base font-bold text-sky-700">
                    - <AnimatedNumber value={housingSupportAmount} /> {currency}
                  </div>
                </div>
              )}
              
              <div className="bg-white p-3 rounded-md shadow-sm border border-slate-200/60 mb-5 relative overflow-hidden">
                <div className="absolute start-0 top-0 bottom-0 w-1 bg-slate-800"></div>
                <div className="text-[11px] text-slate-500 font-semibold mb-0.5 ms-2">{t.netPrice}</div>
                <div className="text-base font-bold text-slate-900 ms-2">
                  <AnimatedNumber value={netPrice} /> {currency}
                </div>
              </div>

              <button
                onClick={exportToExcel}
                disabled={!isValidPct}
                className={`hidden sm:flex transition-colors text-white px-4 py-2.5 rounded font-semibold text-xs items-center gap-2 w-full justify-center mt-2 shadow-sm ${isValidPct ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400 cursor-not-allowed'}`}
              >
                <FileSpreadsheet size={16} className={isValidPct ? 'text-emerald-400' : 'text-slate-300'} /> {t.exportBtn}
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-hidden">
              {/* Printing Header / Financial Summary */}
              <div className="bg-slate-900 text-white p-6 rounded-lg shadow-md flex flex-wrap justify-between items-center gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t.exTotalUnits(numUnits)}</span>
                  <span className="text-xl font-bold">{formatPrice(totalPrice)} {currency}</span>
                </div>
                
                <div className="flex gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t.discountPct} ({discount}%)</span>
                    <span className="text-emerald-400 font-bold">-{formatPrice(amountSaved)}</span>
                  </div>
                  
                  {isBeneficiary && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sky-400 text-[10px] font-bold uppercase tracking-widest">{t.housingSupport} (10%)</span>
                      <span className="text-sky-300 font-bold">-{formatPrice(housingSupportAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="bg-amber-700 px-5 py-3 rounded-md flex flex-col items-center">
                  <span className="text-amber-200 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{t.netPrice}</span>
                  <span className="text-2xl font-black">{formatPrice(netPrice)} {currency}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead>
                    <tr>
                      <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.paymentPhase}</th>
                      <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.milestone}</th>
                      <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.percentage}</th>
                      <th className="bg-slate-50 text-slate-500 px-4 py-3 border-b-2 border-slate-200 uppercase text-[11px] tracking-wider font-bold text-start">{t.amountCol} ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-slate-700 text-start">{t.downPayment}</td>
                      <td className="px-4 py-3 text-slate-500 text-start">{t.uponBooking}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 text-start">{downPaymentPct}%</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-start">
                        <AnimatedNumber value={netPrice * (downPaymentPct / 100)} />
                      </td>
                    </tr>

                    {installments.map((valStr, i) => {
                      const parsed = parseFloat(valStr) || 0;
                      return (
                        <tr key={i} className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-slate-700 text-start">{t.installment} {i + 1}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-start">{paymentFreq === 'monthly' ? t.freqMonthly : t.freqQuarterly} {i + 1}</td>
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
                          <td className="px-4 py-2.5 font-mono text-slate-600 text-start">
                            <AnimatedNumber value={netPrice * (parsed / 100)} />
                          </td>
                        </tr>
                      );
                    })}

                    <tr>
                      <td className="px-4 py-3 text-slate-700 text-start">{t.handover}</td>
                      <td className="px-4 py-3 text-slate-500 text-start">{t.keyHandover}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 text-start">{handoverPct}%</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-start">
                        <AnimatedNumber value={netPrice * (handoverPct / 100)} />
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <td colSpan={2} className="px-4 py-3 text-slate-800 text-start">{t.grandTotal}</td>
                      <td className={`px-4 py-3 text-start ${isValidPct ? 'text-emerald-600' : 'text-red-600'}`}>{totalPctSum}%</td>
                      <td className="px-4 py-3 font-mono text-amber-700 text-start">
                        <AnimatedNumber value={netPrice} />
                      </td>
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
                    <span className="font-mono"><AnimatedNumber value={netPrice / numUnits} /></span> {currency}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        </>
      )}

      <footer className="text-[11px] text-slate-500 py-4 px-8 bg-white border-t border-slate-200 shrink-0 mt-auto">
        <strong className="text-slate-700">{t.termsTitle}</strong> {t.terms1} {discountVal}{t.terms2} {villaConfigs[villaType].name}. {t.validText}
      </footer>
    </div>
  );
}
