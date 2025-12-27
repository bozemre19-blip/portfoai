import React, { useState, useEffect } from 'react';
import { Child, Attendance, AttendanceStatus } from '../types';
import {
  getChildren,
  getTodayAttendance,
  bulkRecordAttendance,
  getAttendanceStats,
  getAttendanceByDate,
  updateAttendance
} from '../services/api';
import { useAuth } from '../App';
import { t } from '../constants.clean';

interface AttendanceScreenProps {
  navigate: (page: string, params?: any) => void;
}

const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [classroomFilter, setClassroomFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
      loadStats();
    }
  }, [user, selectedDate]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [childrenData, attendanceData] = await Promise.all([
        getChildren(user.id),
        getAttendanceByDate(user.id, selectedDate)
      ]);

      setChildren(childrenData);
      setTodayAttendance(attendanceData);

      // Initialize attendance map
      const map = new Map<string, AttendanceStatus>();
      attendanceData.forEach(att => {
        map.set(att.child_id, att.status);
      });
      setAttendanceRecords(map);
    } catch (e: any) {
      setError(e?.message || t('dataLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get this month's stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const monthStats = await getAttendanceStats(user.id, startOfMonth, endOfMonth);
      setStats(monthStats);
    } catch (e) {
      console.error('Stats error:', e);
    }
  };

  const handleStatusChange = (childId: string, status: AttendanceStatus) => {
    const newMap = new Map(attendanceRecords);
    newMap.set(childId, status);
    setAttendanceRecords(newMap);
  };

  const handleSaveAttendance = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const records = Array.from(attendanceRecords.entries()).map(([childId, status]) => ({
        childId,
        userId: user.id,
        date: selectedDate,
        status,
      }));

      await bulkRecordAttendance(records);
      await loadData();
      await loadStats();
      alert('✅ ' + t('attendanceSaved'));
    } catch (e: any) {
      setError(e?.message || t('attendanceSaveFailed'));
      alert('❌ ' + t('errorOccurred') + ': ' + (e?.message || t('attendanceSaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMarkAll = (status: AttendanceStatus) => {
    const newMap = new Map<string, AttendanceStatus>();
    filteredChildren.forEach(child => {
      newMap.set(child.id, status);
    });
    setAttendanceRecords(newMap);
  };

  const getStatusColor = (status?: AttendanceStatus) => {
    if (!status) return 'bg-gray-100 border-gray-300 text-gray-500';
    switch (status) {
      case 'present': return 'bg-green-100 border-green-500 text-green-800';
      case 'absent': return 'bg-red-100 border-red-500 text-red-800';
      case 'late': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'excused': return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getStatusIcon = (status?: AttendanceStatus) => {
    if (!status) return '❓';
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'excused': return '📝';
    }
  };

  const getStatusText = (status?: AttendanceStatus) => {
    if (!status) return t('unmarked');
    switch (status) {
      case 'present': return t('present');
      case 'absent': return t('absent');
      case 'late': return t('late');
      case 'excused': return t('excused');
    }
  };

  const classrooms = [...new Set(children.map(c => c.classroom).filter(Boolean))];

  const filteredChildren = children.filter(child => {
    // Sınıf filtresi
    if (classroomFilter && child.classroom !== classroomFilter) {
      return false;
    }

    // Durum filtresi
    if (statusFilter) {
      const childStatus = attendanceRecords.get(child.id);
      if (statusFilter === 'present' || statusFilter === 'absent' || statusFilter === 'late' || statusFilter === 'excused') {
        return childStatus === statusFilter;
      }
    }

    return true;
  });

  const presentCount = Array.from(attendanceRecords.values()).filter(s => s === 'present').length;
  const absentCount = Array.from(attendanceRecords.values()).filter(s => s === 'absent').length;
  const lateCount = Array.from(attendanceRecords.values()).filter(s => s === 'late').length;
  const excusedCount = Array.from(attendanceRecords.values()).filter(s => s === 'excused').length;
  const unmarkedCount = children.length - attendanceRecords.size;

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (loading) return <p className="text-gray-600">{t('loading')}</p>;
  if (error) return <p className="text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              📋 {t('attendanceSystem')}
            </h1>
            <p className="text-white/80 mt-1">{t('dailyAttendanceTracking')}</p>
          </div>
          {stats && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-4xl font-bold">{stats.attendanceRate}%</div>
              <div className="text-sm mt-1">{t('thisMonthAttendance')}</div>
            </div>
          )}
        </div>

        {/* Quick Stats - Tıklanabilir Filtre Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'present' ? null : 'present')}
            className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transition-all hover:bg-white/20 hover:scale-105 ${statusFilter === 'present' ? 'ring-4 ring-white/50 scale-105' : ''
              }`}
          >
            <div className="text-2xl font-bold">{presentCount}</div>
            <div className="text-sm opacity-80">✅ {t('present')}</div>
            {statusFilter === 'present' && (
              <div className="text-xs mt-1 bg-white/30 rounded px-2 py-0.5 inline-block">{t('filtering')}</div>
            )}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'absent' ? null : 'absent')}
            className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transition-all hover:bg-white/20 hover:scale-105 ${statusFilter === 'absent' ? 'ring-4 ring-white/50 scale-105' : ''
              }`}
          >
            <div className="text-2xl font-bold">{absentCount}</div>
            <div className="text-sm opacity-80">❌ {t('absent')}</div>
            {statusFilter === 'absent' && (
              <div className="text-xs mt-1 bg-white/30 rounded px-2 py-0.5 inline-block">{t('filtering')}</div>
            )}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'late' ? null : 'late')}
            className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transition-all hover:bg-white/20 hover:scale-105 ${statusFilter === 'late' ? 'ring-4 ring-white/50 scale-105' : ''
              }`}
          >
            <div className="text-2xl font-bold">{lateCount}</div>
            <div className="text-sm opacity-80">⏰ {t('late')}</div>
            {statusFilter === 'late' && (
              <div className="text-xs mt-1 bg-white/30 rounded px-2 py-0.5 inline-block">{t('filtering')}</div>
            )}
          </button>
          <button
            onClick={() => setStatusFilter(null)}
            className={`bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center transition-all hover:bg-white/20 hover:scale-105 ${!statusFilter ? 'ring-4 ring-white/50 scale-105' : ''
              }`}
          >
            <div className="text-2xl font-bold">{children.length}</div>
            <div className="text-sm opacity-80">👥 {t('allItems')}</div>
            {!statusFilter && (
              <div className="text-xs mt-1 bg-white/30 rounded px-2 py-0.5 inline-block">{t('fullList')}</div>
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-md p-6 space-y-4 transition-colors border border-transparent dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('selectDate')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {classrooms.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('filterClass')}</label>
              <select
                value={classroomFilter}
                onChange={(e) => setClassroomFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t('allClasses')}</option>
                {classrooms.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">{t('quickAction')}:</span>
          <button
            onClick={() => handleQuickMarkAll('present')}
            className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all text-sm font-medium border border-transparent dark:border-green-800"
          >
            ✅ {t('markAllPresent')}
          </button>
          <button
            onClick={() => handleQuickMarkAll('absent')}
            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all text-sm font-medium border border-transparent dark:border-red-800"
          >
            ❌ {t('markAllAbsent')}
          </button>
        </div>
      </div>

      {/* Active Filter Banner */}
      {statusFilter && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 border-2 border-orange-200 dark:border-orange-700 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {statusFilter === 'present' && '✅'}
              {statusFilter === 'absent' && '❌'}
              {statusFilter === 'late' && '⏰'}
              {statusFilter === 'excused' && '📝'}
            </span>
            <div>
              <div className="font-bold text-gray-900 dark:text-white">
                Filtre: {getStatusText(statusFilter)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {filteredChildren.length} {t('studentsShown')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter(null)}
            className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg border-2 border-gray-300 dark:border-gray-600 font-medium transition-all hover:shadow-md"
          >
            🔄 {t('clearFilter')}
          </button>
        </div>
      )}

      {/* Children List */}
      {filteredChildren.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <span className="text-6xl mb-4 block">
            {statusFilter ? '🔍' : '👦'}
          </span>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {statusFilter
              ? `"${getStatusText(statusFilter)}" durumunda öğrenci bulunamadı.`
              : 'Hiç çocuk bulunamadı.'}
          </p>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter(null)}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
            >
              {t('showAll')}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-md overflow-hidden transition-colors">
          {/* Table Header Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-3 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">👥</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">{t('studentList')}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredChildren.length} {t('studentsShown')}
                  {statusFilter && ` (${getStatusText(statusFilter)})`}
                </div>
              </div>
            </div>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter(null)}
                className="text-sm px-3 py-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 transition-all"
              >
                {t('showAllList')}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-200">{t('photo')}</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-200">{t('nameSurname')}</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-200">{t('classroom')}</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-gray-200">{t('status')}</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-gray-200">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredChildren.map((child, idx) => {
                  const status = attendanceRecords.get(child.id);
                  return (
                    <tr key={child.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-[#1a1a2e]' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden">
                          {child.photo_url ? (
                            <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover" />
                          ) : (
                            child.first_name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate('child-detail', { childId: child.id })}
                          className="font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        >
                          {child.first_name} {child.last_name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{child.classroom || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(status)}`}>
                          <span className="text-lg">{getStatusIcon(status)}</span>
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleStatusChange(child.id, 'present')}
                            className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-green-500 text-white scale-110' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                            title="Geldi"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handleStatusChange(child.id, 'absent')}
                            className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-red-500 text-white scale-110' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                            title="Gelmedi"
                          >
                            ❌
                          </button>
                          <button
                            onClick={() => handleStatusChange(child.id, 'late')}
                            className={`p-2 rounded-lg transition-all ${status === 'late' ? 'bg-yellow-500 text-white scale-110' : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'}`}
                            title="Geç Geldi"
                          >
                            ⏰
                          </button>
                          <button
                            onClick={() => handleStatusChange(child.id, 'excused')}
                            className={`p-2 rounded-lg transition-all ${status === 'excused' ? 'bg-blue-500 text-white scale-110' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                            title="Mazeret"
                          >
                            📝
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      {filteredChildren.length > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || attendanceRecords.size === 0}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? '💾 ' + t('savingAttendance') : '💾 ' + t('saveAttendance')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceScreen;

