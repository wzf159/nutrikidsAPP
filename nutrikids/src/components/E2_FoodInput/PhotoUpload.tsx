import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Props { onUpload: (file: File) => void; }

export default function PhotoUpload({ onUpload }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-400 hover:bg-orange-50 transition-all text-sm font-medium text-gray-700 group"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
        <span>{t('input.uploadPhoto')}</span>
      </button>
    </>
  );
}
