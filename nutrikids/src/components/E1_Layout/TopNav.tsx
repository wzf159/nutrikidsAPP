import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { AGE_GROUPS, bmiOf } from '../../data/growth';
import { getChildren, getAllergens, type Child, type Allergen } from '../../services/api';
import { useSession, signOut } from '../../lib/auth';

const ACTIVE_KEY = 'nutrikids_active_child_id';

const NAV_ITEMS: { icon: string; key: string; path: string }[] = [
  { icon: '🏷️', key: 'nav.foodAnalyzer', path: '/food-analyzer' },
  { icon: '🌱', key: 'nav.scienceInsights', path: '/science-insights' },
  { icon: '💬', key: 'nav.feedback', path: '/feedback' },
];

export default function TopNav() {
  const { data: session } = useSession();
  const user = session?.user;

  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  );
  const [cardOpen, setCardOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [allergenDict, setAllergenDict] = useState<Allergen[]>([]);

  const loadChildren = () => {
    getChildren().then(cs => {
      setChildren(cs);
      const stored = localStorage.getItem(ACTIVE_KEY);
      const valid = cs.find(c => c.id === stored);
      if (!valid && cs.length > 0) {
        setActiveId(cs[0].id);
        localStorage.setItem(ACTIVE_KEY, cs[0].id);
      }
    }).catch(() => setChildren([]));
  };

  const switchChild = (id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    setCardOpen(false);
    window.dispatchEvent(new Event('nutrikids:child-updated'));
  };

  useEffect(() => {
    getAllergens().then(setAllergenDict).catch(() => {});
  }, []);

  useEffect(() => {
    loadChildren();
    window.addEventListener('nutrikids:child-updated', loadChildren);
    return () => window.removeEventListener('nutrikids:child-updated', loadChildren);
  }, []);

  useEffect(() => {
    if (!cardOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setCardOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [cardOpen]);

  const child = children.find(c => c.id === activeId) ?? children[0] ?? null;

  const ageText = child
    ? child.stageKey?.endsWith('m') && child.ageMonths != null
      ? `${child.ageMonths} ${isZh ? '个月' : i18n.language === 'es' ? 'meses' : 'mo'}`
      : child.age != null
        ? `${child.age} ${isZh ? '岁' : i18n.language === 'es' ? 'años' : 'yrs'}`
        : ''
    : '';
  const bmi = child?.heightCm && child?.weightKg ? bmiOf(child.heightCm, child.weightKg) : null;
  const childAllergens = child
    ? child.allergens
        .map(ca => allergenDict.find(a => a.id === ca.allergenId))
        .filter((a): a is Allergen => !!a)
    : [];
  const avatar = child?.avatarEmoji ?? '👶';

  return (
    <header className="relative sticky top-0 z-50 h-[62px] bg-white/70 [backdrop-filter:blur(32px)_saturate(200%)] [-webkit-backdrop-filter:blur(32px)_saturate(200%)] border-b border-white/80 px-3 sm:px-7 flex items-center gap-2 sm:gap-5">
      <NavLink to="/" className="flex items-center gap-1.5 shrink-0">
        <img src="/images/logo21.png" alt="" className="h-9 w-auto" />
        <img src="/images/logo4.png" alt="NutriKids" className="h-6 w-auto hidden sm:block" />
      </NavLink>

      {/* 导航标签：始终显示，窄屏只留图标 */}
      <nav className="flex items-center gap-1 sm:gap-2 overflow-hidden">
        {NAV_ITEMS.map(({ icon, key, path }, i) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              i === 0
                ? `flex items-center gap-1.5 px-2.5 sm:px-[18px] py-[7px] rounded-full text-sm font-bold text-white whitespace-nowrap bg-gradient-to-r from-[#893ce3] to-[#ec4899] shadow-[0_2px_12px_rgba(236,72,153,0.3)] transition-all ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.02]'}`
                : `px-2 sm:px-[10px] py-[6px] rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive ? 'bg-purple-600/10 text-purple-700' : 'text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.07)]'
                  }`
            }
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">&nbsp;{t(key)}</span>
          </NavLink>
        ))}

        <NavLink
          to="/Support"
          className={({ isActive }) =>
            `px-2 sm:px-[10px] py-[6px] rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              isActive ? 'bg-purple-600/10 text-purple-700' : 'text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.07)]'
            }`
          }
        >
          <span>💛</span>
          <span className="hidden sm:inline">&nbsp;{isZh ? '支持我们' : i18n.language === 'es' ? 'Apóyanos' : 'Support Us'}</span>
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `px-2 sm:px-[10px] py-[6px] rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              isActive ? 'bg-purple-600/10 text-purple-700' : 'text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.07)]'
            }`
          }
        >
          <span>ℹ️</span>
          <span className="hidden sm:inline">&nbsp;{isZh ? '关于我们' : i18n.language === 'es' ? 'Acerca de' : 'About'}</span>
        </NavLink>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* 桌面端：孩子选择器 + 语言切换（≥sm 显示） */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative" ref={wrapRef}>
            {child ? (
              <button
                onClick={() => setCardOpen(o => !o)}
                className="flex items-center gap-2 bg-white/70 border-[1.5px] border-[rgba(100,120,160,0.15)] rounded-full py-1 px-[14px] pl-[6px] [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)] cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#893ce3] to-[#ec4899] flex items-center justify-center text-[17px]">{avatar}</span>
                <span className="text-sm font-bold text-[#893ce3] whitespace-nowrap">
                  {child.name}{ageText ? `, ${ageText}` : ''} ▾
                </span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/onboarding')}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-sm font-bold shadow-[0_4px_16px_rgba(249,115,22,0.25)] whitespace-nowrap"
              >
                ✨ {t('nav.getStarted')}
              </button>
            )}

            {cardOpen && child && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[272px] bg-white/96 backdrop-blur-xl rounded-[18px] shadow-[0_16px_48px_rgba(80,40,160,0.16),0_2px_12px_rgba(0,0,0,0.08)] border-[1.5px] border-[rgba(137,60,227,0.12)] overflow-hidden animate-[pop-in_0.18s_cubic-bezier(0.34,1.56,0.64,1)]">

                <div className="flex items-center gap-3 px-4 pt-4 pb-3.5">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#893ce3] to-[#ec4899] flex items-center justify-center text-[22px] flex-shrink-0">{avatar}</span>
                  <div>
                    <p className="text-[15px] font-bold text-[#1a1040]">{child.name}</p>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      <p className="text-xs font-semibold text-gray-400">
                        {ageText}
                      </p>
                      {child.gender && child.gender !== 'other' && (
                        <p className="text-xs font-semibold text-gray-400">
                          {{ boy: isZh ? '男孩' : i18n.language === 'es' ? 'Niño' : 'Boy', girl: isZh ? '女孩' : i18n.language === 'es' ? 'Niña' : 'Girl' }[child.gender]}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setCardOpen(false); navigate(`/onboarding?childId=${child.id}`); }}
                    className="ml-auto px-2.5 py-1 rounded-lg bg-purple-600/8 border border-purple-600/18 text-xs font-bold text-[#893ce3] hover:bg-purple-600/15 whitespace-nowrap"
                  >
                    ✏️ {isZh ? '编辑' : i18n.language === 'es' ? 'Editar' : 'Edit'}
                  </button>
                </div>

                <div className="h-px bg-purple-600/8" />
                <div className="grid grid-cols-3 px-3 py-3.5">
                  {[
                    { icon: '📏', label: isZh ? '身高' : i18n.language === 'es' ? 'Altura' : 'Height', value: child.heightCm ? `${child.heightCm} cm` : '—' },
                    { icon: '⚖️', label: isZh ? '体重' : i18n.language === 'es' ? 'Peso' : 'Weight', value: child.weightKg ? `${child.weightKg} kg` : '—' },
                    { icon: '📐', label: 'BMI', value: bmi != null ? String(bmi) : '—' },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center gap-1 px-1 py-2 rounded-xl hover:bg-purple-600/5 cursor-pointer">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
                      <span className="text-[15px] font-bold text-[#1a1040]">{s.value}</span>
                    </div>
                  ))}
                </div>

                {childAllergens.length > 0 && (
                  <>
                    <div className="h-px bg-purple-600/8" />
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                        {isZh ? '过敏原' : i18n.language === 'es' ? 'Alérgenos' : 'Allergens'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {childAllergens.map(a => (
                          <span
                            key={a.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(236,72,153,0.08)] border border-[rgba(236,72,153,0.2)] text-[11px] font-bold text-[#be185d]"
                          >
                            {a.icon} {isZh ? (a.nameZh ?? a.name) : a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {children.length > 1 && (
                  <>
                    <div className="h-px bg-purple-600/8" />
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1 mb-1.5">
                        {isZh ? '切换孩子' : i18n.language === 'es' ? 'Cambiar niño' : 'Switch Child'}
                      </p>
                      {children.map(c => (
                        <button
                          key={c.id}
                          onClick={() => switchChild(c.id)}
                          className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors ${
                            c.id === child.id
                              ? 'bg-purple-600/10 text-[#893ce3]'
                              : 'hover:bg-purple-600/5 text-[#1a1040]'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#893ce3] to-[#ec4899] flex items-center justify-center text-[15px] flex-shrink-0">
                            {c.avatarEmoji ?? '🧒'}
                          </span>
                          <span className="text-sm font-semibold">{c.name}</span>
                          {c.id === child.id && (
                            <span className="ml-auto text-[10px] font-bold text-[#893ce3]">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="h-px bg-purple-600/8" />
                <div className="px-3 py-2.5">
                  <button
                    onClick={() => { setCardOpen(false); navigate('/onboarding'); }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left hover:bg-purple-600/5 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-purple-300 flex items-center justify-center text-purple-400 text-lg flex-shrink-0">+</span>
                    <span className="text-sm font-semibold text-[#893ce3]">
                      {isZh ? '添加新孩子' : i18n.language === 'es' ? 'Agregar niño' : 'Add Child'}
                    </span>
                  </button>
                </div>

                <div className="h-px bg-purple-600/8" />
                <div className="px-4 py-3 flex items-center gap-2.5">
                  {user?.image && (
                    <img src={user.image} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-700 truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })}
                    className="text-[11px] font-bold text-red-400 hover:text-red-600 whitespace-nowrap"
                  >
                    {isZh ? '退出' : i18n.language === 'es' ? 'Salir' : 'Sign out'}
                  </button>
                </div>

              </div>
            )}
          </div>

          <LanguageSwitcher />
        </div>

        {/* 手机端：汉堡按钮（<sm 显示），只收纳孩子选择器 + 语言切换 */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-purple-600/8 text-[#2a2a4a] text-xl flex-shrink-0"
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 手机端折叠面板：只有孩子选择器 + 语言切换 */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white/96 backdrop-blur-xl border-b border-white/80 shadow-[0_16px_48px_rgba(80,40,160,0.16)] px-5 py-4 flex flex-col gap-3">
          {child ? (
            <button
              onClick={() => setCardOpen(o => !o)}
              className="flex items-center gap-2 bg-white/70 border-[1.5px] border-[rgba(100,120,160,0.15)] rounded-full py-1.5 px-[14px] pl-[6px] w-fit"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#893ce3] to-[#ec4899] flex items-center justify-center text-[17px]">{avatar}</span>
              <span className="text-sm font-bold text-[#893ce3] whitespace-nowrap">
                {child.name}{ageText ? `, ${ageText}` : ''} ▾
              </span>
            </button>
          ) : (
            <button
              onClick={() => { setMenuOpen(false); navigate('/onboarding'); }}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-sm font-bold shadow-[0_4px_16px_rgba(249,115,22,0.25)] whitespace-nowrap w-fit"
            >
              ✨ {t('nav.getStarted')}
            </button>
          )}

          {/* 手机端孩子详情卡片，复用同一个 cardOpen 状态 */}
          {cardOpen && child && (
            <div className="w-full bg-white/96 backdrop-blur-xl rounded-[18px] shadow-[0_16px_48px_rgba(80,40,160,0.16),0_2px_12px_rgba(0,0,0,0.08)] border-[1.5px] border-[rgba(137,60,227,0.12)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 pt-4 pb-3.5">
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#893ce3] to-[#ec4899] flex items-center justify-center text-[22px] flex-shrink-0">{avatar}</span>
                <div>
                  <p className="text-[15px] font-bold text-[#1a1040]">{child.name}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">{ageText}</p>
                </div>
                <button
                  onClick={() => { setCardOpen(false); setMenuOpen(false); navigate(`/onboarding?childId=${child.id}`); }}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-purple-600/8 border border-purple-600/18 text-xs font-bold text-[#893ce3] hover:bg-purple-600/15 whitespace-nowrap"
                >
                  ✏️ {isZh ? '编辑' : i18n.language === 'es' ? 'Editar' : 'Edit'}
                </button>
              </div>

              <div className="h-px bg-purple-600/8" />
              <div className="grid grid-cols-3 px-3 py-3.5">
                {[
                  { icon: '📏', label: isZh ? '身高' : i18n.language === 'es' ? 'Altura' : 'Height', value: child.heightCm ? `${child.heightCm} cm` : '—' },
                  { icon: '⚖️', label: isZh ? '体重' : i18n.language === 'es' ? 'Peso' : 'Weight', value: child.weightKg ? `${child.weightKg} kg` : '—' },
                  { icon: '📐', label: 'BMI', value: bmi != null ? String(bmi) : '—' },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center gap-1 px-1 py-2 rounded-xl">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
                    <span className="text-[15px] font-bold text-[#1a1040]">{s.value}</span>
                  </div>
                ))}
              </div>

              {children.length > 1 && (
                <>
                  <div className="h-px bg-purple-600/8" />
                  <div className="px-3 py-2">
                    {children.map(c => (
                      <button
                        key={c.id}
                        onClick={() => switchChild(c.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors ${
                          c.id === child.id ? 'bg-purple-600/10 text-[#893ce3]' : 'hover:bg-purple-600/5 text-[#1a1040]'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#893ce3] to-[#ec4899] flex items-center justify-center text-[15px] flex-shrink-0">
                          {c.avatarEmoji ?? '🧒'}
                        </span>
                        <span className="text-sm font-semibold">{c.name}</span>
                        {c.id === child.id && <span className="ml-auto text-[10px] font-bold text-[#893ce3]">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="h-px bg-purple-600/8" />
              <div className="px-3 py-2.5">
                <button
                  onClick={() => { setCardOpen(false); setMenuOpen(false); navigate('/onboarding'); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left hover:bg-purple-600/5 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full border-2 border-dashed border-purple-300 flex items-center justify-center text-purple-400 text-lg flex-shrink-0">+</span>
                  <span className="text-sm font-semibold text-[#893ce3]">
                    {isZh ? '添加新孩子' : i18n.language === 'es' ? 'Agregar niño' : 'Add Child'}
                  </span>
                </button>
              </div>

              <div className="h-px bg-purple-600/8" />
              <div className="px-4 py-3 flex items-center gap-2.5">
                {user?.image && <img src={user.image} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-700 truncate">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })}
                  className="text-[11px] font-bold text-red-400 hover:text-red-600 whitespace-nowrap"
                >
                  {isZh ? '退出' : i18n.language === 'es' ? 'Salir' : 'Sign out'}
                </button>
              </div>
            </div>
          )}

          <LanguageSwitcher />
        </div>
      )}
    </header>
  );
}
