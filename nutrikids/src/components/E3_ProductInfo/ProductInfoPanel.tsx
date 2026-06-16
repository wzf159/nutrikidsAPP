import { useTranslation } from 'react-i18next';

interface FoodData {
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  processingLevel: string;
  verified: boolean;
  updatedToday: boolean;
}

interface Props { food: FoodData | null; }

/** S3.1 · Product detail section — image + name + category + badges. Rendered inside the Food Information card. */
export default function ProductInfoPanel({ food }: Props) {
  const { t } = useTranslation();
  if (!food) return null;

  return (
    <div className="flex gap-5 items-start flex-1 min-w-0">
      {/* Food image */}
      <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        {food.imageUrl ? (
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-full h-full object-contain p-1"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-4xl">🥛</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-lg leading-snug">{food.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{food.category}</p>

        <span className="inline-block mt-2.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-500">
          {food.processingLevel}
        </span>

        <div className="flex flex-col gap-2 mt-3">
          {food.verified && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
              {t('product.verifiedProduct')}
            </div>
          )}
          {food.updatedToday && (
            <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-500">
              <span>ⓘ</span>
              {t('product.updatedToday')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
