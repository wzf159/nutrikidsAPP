import { useState, useEffect } from 'react';
import { fetchFeedbacks, fetchFeedbackStats, type FeedbackItem, type FeedbackStats } from '../../services/data';

export default function FeedbackStatsPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fb, st] = await Promise.all([fetchFeedbacks(), fetchFeedbackStats()]);
      setFeedbacks(fb.feedbacks);
      setStats(st);
    } catch (err) {
      console.error('Failed to load feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNPSColor = (nps: number) => {
    if (nps >= 7) return 'bg-green-100 text-green-700';
    if (nps >= 4) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getRatingEmoji = (rating: string | null) => {
    const map: Record<string, string> = {
      '😞': '非常不满意',
      '😕': '不满意',
      '😐': '一般',
      '😊': '满意',
      '😍': '非常满意',
    };
    return map[rating || ''] || rating || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">反馈统计</h1>
          <p className="text-gray-500 mt-1">用户问卷反馈数据概览与明细</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          🔄 刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">总反馈数</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.total ?? 0}</div>
        </div>
        <div className={`rounded-xl p-5 shadow-sm border border-gray-100 ${getNPSColor(stats?.avgNPS ?? 0)}`}>
          <div className="text-sm font-medium mb-1">平均 NPS 评分</div>
          <div className="text-3xl font-bold">{(stats?.avgNPS ?? 0).toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Q1 平均满意度</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.q1.length ? `${((stats.q1.reduce((sum, s) => {
              const scoreMap: Record<string, number> = { '😞': 1, '😕': 2, '😐': 3, '😊': 4, '😍': 5 };
              return sum + (s.value ? (scoreMap[s.value] || 0) * s.count : 0);
            }, 0) / stats.total) * 20).toFixed(0)}%` : '-'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">有效问卷率</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.total ? `${((feedbacks.filter(f => f.q1 && f.q2 && f.q3 && f.q4 && f.q5).length / stats.total) * 100).toFixed(0)}%` : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Q1: 有用性评分分布</h3>
          <div className="space-y-3">
            {stats?.q1.sort((a, b) => b.count - a.count).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-8 text-lg">{item.value || '-'}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all"
                    style={{ width: `${(item.count / (stats?.total || 1)) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-600 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Q5: NPS 评分分布</h3>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
              const stat = stats?.q5.find(s => s.value === num.toString());
              const count = stat?.count || 0;
              const max = Math.max(...(stats?.q5.map(s => s.count) || [1]));
              const height = max ? (count / max) * 100 : 0;
              return (
                <div key={num} className="flex flex-col items-center gap-1">
                  <div className="w-8 bg-gray-100 rounded-md flex items-end justify-center overflow-hidden" style={{ height: '60px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all ${num >= 9 ? 'bg-green-500' : num >= 7 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{num}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">反馈答案列表</h3>
          <p className="text-sm text-gray-500 mt-1">共 {feedbacks.length} 条记录</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">时间</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Q1<br/>有用性</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Q2<br/>清晰度</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Q3<br/>最有用</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Q4<br/>期望功能</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Q5<br/>NPS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {feedbacks.map(fb => (
                <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(fb.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {fb.user?.email || '匿名'}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                      {getRatingEmoji(fb.q1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[150px] truncate" title={fb.q2 || ''}>
                    {fb.q2 || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[150px] truncate" title={fb.q3 || ''}>
                    {fb.q3 || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[150px] truncate" title={fb.q4 || ''}>
                    {fb.q4 || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {fb.q5 ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${fb.q5 >= '9' ? 'bg-green-500' : fb.q5 >= '7' ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {fb.q5}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={fb.comment || ''}>
                    {fb.comment || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {feedbacks.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p>暂无反馈数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
