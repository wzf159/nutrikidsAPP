import { useTranslation } from 'react-i18next';

interface Props { onClick: () => void; }

export default function BarcodeScanner({ onClick }: Props) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-green-400 hover:bg-green-50 transition-all text-sm font-medium text-gray-700 group"
    >
      <span className="text-xl group-hover:scale-110 transition-transform">📷</span>
      <span>{t('input.scanBarcode')}</span>
    </button>
  );
}
