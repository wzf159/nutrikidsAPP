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
    label: '数据源',
    icon: '🔌',
    items: [
      { path: '/dev-admin/datasources/nih-ods', label: 'NIH 微量营养素', badge: 'API',  badgeColor: 'bg-blue-100 text-blue-600' },
      { path: '/dev-admin/datasources/jecfa',   label: 'JECFA 添加剂',   badge: 'HTML', badgeColor: 'bg-amber-100 text-amber-600' },
      { path: '/dev-admin/datasources/fda',     label: 'FDA 添加剂法规', badge: 'HTML', badgeColor: 'bg-amber-100 text-amber-600' },
      { path: '/dev-admin/datasources/efsa',    label: 'EFSA 欧洲评估',  badge: 'HTML', badgeColor: 'bg-amber-100 text-amber-600' },
      { path: '/dev-admin/datasources/off',     label: 'Open Food Facts', badge: 'API', badgeColor: 'bg-green-100 text-green-600' },
    ],
  },
  {
    label: '评分规则',
    icon: '🏷️',
    items: [
      { path: '/dev-admin/rules/who',           label: 'WHO 饮食指南' },
      { path: '/dev-admin/rules/dga',           label: '美国膳食指南' },
      { path: '/dev-admin/rules/aap-nutrition', label: 'AAP 儿童营养' },
      { path: '/dev-admin/rules/aap-additives', label: 'AAP 添加剂报告' },
      { path: '/dev-admin/rules/aha',           label: 'AHA 心血管' },
      { path: '/dev-admin/rules/nova',          label: 'NOVA 加工分级' },
    ],
  },
  {
    label: '评分模型',
    icon: '🧮',
    items: [
      { path: '/dev-admin/models/nutriscore',  label: 'Nutri-Score' },
      { path: '/dev-admin/models/nrf',         label: 'NRF 营养密度' },
      { path: '/dev-admin/models/fda-healthy', label: 'FDA Healthy' },
    ],
  },
  {
    label: '页面设计',
    icon: '📄',
    items: [
      { path: '/dev-admin/science-insights', label: 'ScienceInsights', badge: '设计', badgeColor: 'bg-purple-100 text-purple-600' },
      { path: '/dev-admin/datasources/food-analysis', label: '食品分析功能', badge: '核心', badgeColor: 'bg-pink-100 text-pink-600' },
    ],
  },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 py-4 px-2 overflow-y-auto">
        <p className="px-3 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.devTitle')}</p>
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
                    isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
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
