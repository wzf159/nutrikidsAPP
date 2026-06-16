import { useTranslation } from 'react-i18next';

interface Child {
  id: string;
  name: string;
  age: number;
  stage: string;
  avatarEmoji: string;
}

interface Props {
  child: Child | null;
  childList: Child[];
  onSwitch: (id: string) => void;
}

/** S5.1 · Child profile header — avatar + name + age + stage. Top of the Alex Profile card. */
export default function ChildProfileCard({ child, childList, onSwitch }: Props) {
  const { t } = useTranslation();
  if (!child) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-200 rounded-full flex items-center justify-center text-4xl shrink-0">
        {child.avatarEmoji}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-green-600 text-lg leading-tight">
          {child.name} {t('child.profileWord')}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {child.name}, {child.age} {t('child.years')}
        </p>
        <p className="text-sm mt-0.5">
          <span className="text-gray-400">{t('child.stage')}: </span>
          <span className="text-green-600 font-medium">{child.stage}</span>
        </p>
      </div>

      {childList.length > 1 && (
        <select
          value={child.id}
          onChange={e => onSwitch(e.target.value)}
          className="text-xs text-green-600 border border-gray-200 rounded-full px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-300 self-start"
        >
          {childList.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
