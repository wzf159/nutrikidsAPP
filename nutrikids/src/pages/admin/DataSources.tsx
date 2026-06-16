import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchDataSources,
  testDataSource,
  type DataSourceMeta,
  type DataSourceTestResult,
} from '../../services/data';

type TestState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; result: DataSourceTestResult };

export default function DataSources() {
  const { t, i18n } = useTranslation();
  const zh = i18n.language.startsWith('zh');

  const [sources, setSources] = useState<DataSourceMeta[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestState>>({});

  useEffect(() => {
    fetchDataSources()
      .then((d) => setSources(d.sources))
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  async function runTest(id: string) {
    setTests((s) => ({ ...s, [id]: { phase: 'running' } }));
    try {
      const result = await testDataSource(id);
      setTests((s) => ({ ...s, [id]: { phase: 'done', result } }));
    } catch (e) {
      setTests((s) => ({
        ...s,
        [id]: {
          phase: 'done',
          result: {
            id, ok: false, status: 0, latencyMs: 0, contentType: null, bytes: 0,
            sample: null, error: e instanceof Error ? e.message : String(e),
          },
        },
      }));
    }
  }

  const runAll = () => sources.forEach((s) => void runTest(s.id));
  const anyRunning = Object.values(tests).some((t) => t.phase === 'running');

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.dataSources.title')}</h1>
        <button
          onClick={runAll}
          disabled={anyRunning || sources.length === 0}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
        >
          {anyRunning ? t('admin.dataSources.testing') : t('admin.dataSources.testAll')}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">{t('admin.dataSources.subtitle')}</p>

      {loadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {t('admin.dataSources.loadError')}：{loadError}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {sources.map((src) => {
          const test = tests[src.id] ?? { phase: 'idle' as const };
          return (
            <div key={src.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-800">{zh ? src.nameZh : src.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      src.kind === 'api' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {src.kind === 'api' ? 'JSON API' : t('admin.dataSources.htmlOnly')}
                    </span>
                    <StatusBadge test={test} t={t} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{src.org}</p>
                  <p className="text-sm text-gray-500 mt-2">{src.note}</p>
                  <a
                    href={src.homeUrl} target="_blank" rel="noreferrer"
                    className="inline-block mt-1 text-xs text-green-600 hover:underline break-all"
                  >
                    {src.homeUrl}
                  </a>
                </div>
                <button
                  onClick={() => runTest(src.id)}
                  disabled={test.phase === 'running'}
                  className="shrink-0 px-4 py-1.5 border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-50 text-sm font-medium rounded-full transition-colors"
                >
                  {test.phase === 'running' ? t('admin.dataSources.testing') : t('admin.dataSources.test')}
                </button>
              </div>

              {test.phase === 'done' && <ResultPanel result={test.result} t={t} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ test, t }: { test: TestState; t: (k: string) => string }) {
  if (test.phase === 'idle') return null;
  if (test.phase === 'running')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 animate-pulse">{t('admin.dataSources.testing')}</span>;
  return test.result.ok ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">✓ {t('admin.dataSources.connected')}</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">✗ {t('admin.dataSources.failed')}</span>
  );
}

function ResultPanel({ result, t }: { result: DataSourceTestResult; t: (k: string) => string }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
        <span>HTTP <b className={result.ok ? 'text-green-600' : 'text-red-600'}>{result.status || '—'}</b></span>
        <span>{t('admin.dataSources.latency')} <b className="text-gray-700">{result.latencyMs} ms</b></span>
        <span>{t('admin.dataSources.size')} <b className="text-gray-700">{(result.bytes / 1024).toFixed(1)} KB</b></span>
        {result.contentType && <span className="truncate max-w-60">{result.contentType}</span>}
      </div>

      {result.error && (
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
      )}

      {result.sample && (
        <div className="mt-3 bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {t('admin.dataSources.sample')}
          </p>
          {result.sample.title && (
            <p className="text-sm font-medium text-gray-800">{result.sample.title}</p>
          )}
          {result.sample.url && (
            <p className="text-xs text-gray-400 break-all">{result.sample.url}</p>
          )}
          {result.sample.excerpt && (
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{result.sample.excerpt}…</p>
          )}
        </div>
      )}
    </div>
  );
}
