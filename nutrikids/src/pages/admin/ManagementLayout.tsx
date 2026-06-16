import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NavItem {
  path: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

const GROUPS: { label: string; icon: string; items: NavItem[] }[] = [
  {
    label: '数据分析',
    icon: '📊',
    items: [
      { path: '/admin/feedback-stats', label: '反馈统计', badge: '新', badgeColor: 'bg-green-100 text-green-600' },
    ],
  },
];

export default function ManagementLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 py-4 px-2 overflow-y-auto">
        <p className="px-3 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.title')}</p>
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-4">
            <p className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <span>{g.icon}</span>{g.label}
            </p>
            {g.items.map(({ path, label, badge, badgeColor }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                  }`
                }
              >
                <span className="truncate">{label}</span>
                {badge && (
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 rounded-full ${badgeColor}`}>{badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <section className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </section>
    </div>
  );
}