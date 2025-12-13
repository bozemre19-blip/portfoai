import React, { useState, useEffect } from 'react';
import { Goal, GoalStatus, GoalPriority, DevelopmentDomain } from '../types';
import { getGoalsByChild, createGoal, updateGoal, deleteGoal } from '../services/api';
import { getDomains, t, getDateLocale } from '../constants.clean';

interface GoalsSectionProps {
  childId: string;
  userId: string;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ childId, userId }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<DevelopmentDomain>('cognitive');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadGoals();
  }, [childId]);

  const loadGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGoalsByChild(childId);
      setGoals(data);
    } catch (e: any) {
      setError(e?.message || t('goalsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDomain('cognitive');
    setPriority('medium');
    setTargetDate('');
    setNotes('');
    setEditingGoal(null);
    setShowAddForm(false);
  };

  const handleAddGoal = async () => {
    if (!title.trim()) {
      alert('Lütfen hedef başlığı girin');
      return;
    }

    try {
      await createGoal(childId, userId, title, domain, {
        description,
        priority,
        target_date: targetDate || undefined,
        notes,
      });
      await loadGoals();
      resetForm();
    } catch (e: any) {
      alert('Hata: ' + (e?.message || 'Hedef eklenemedi'));
    }
  };

  const handleUpdateProgress = async (goalId: string, newProgress: number) => {
    try {
      const status: GoalStatus = newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started';
      await updateGoal(goalId, { progress: newProgress, status });
      await loadGoals();
    } catch (e: any) {
      alert('Hata: ' + (e?.message || 'Hedef güncellenemedi'));
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteGoal(goalId);
      await loadGoals();
    } catch (e: any) {
      alert('Hata: ' + (e?.message || 'Hedef silinemedi'));
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getStatusText = (status: GoalStatus) => {
    switch (status) {
      case 'completed': return `✅ ${t('statusCompleted')}`;
      case 'in_progress': return `🔄 ${t('statusInProgress')}`;
      case 'not_started': return `⏸️ ${t('statusNotStarted')}`;
      case 'cancelled': return `❌ ${t('statusCancelled')}`;
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityText = (priority: GoalPriority) => {
    switch (priority) {
      case 'high': return `🔴 ${t('priorityHigh')}`;
      case 'medium': return `🟡 ${t('priorityMedium')}`;
      case 'low': return `🟢 ${t('priorityLow')}`;
    }
  };

  if (loading) return <p className="text-gray-600">{t('goalsLoading')}</p>;
  if (error) return <p className="text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🎯 {t('developmentGoals')}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({goals.length})</span>
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
        >
          {showAddForm ? `❌ ${t('cancel')}` : `➕ ${t('addGoal')}`}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 space-y-4 goal-add-form-container">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-200">{t('addNewGoal')}</h4>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('goalTitle')} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('goalTitlePlaceholder')}
              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('developmentArea')} *</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as DevelopmentDomain)}
                className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900"
              >
                {Object.entries(getDomains()).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('priority')} *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900"
              >
                <option value="low">🟢 {t('priorityLow')}</option>
                <option value="medium">🟡 {t('priorityMedium')}</option>
                <option value="high">🔴 {t('priorityHigh')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('targetDate')}</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('descriptionLabel')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddGoal}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              ✅ {t('save')}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <span className="text-6xl mb-4 block">🎯</span>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('noGoalsYet')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('addGoalHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl transition-all goal-item-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{goal.title}</h4>
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{goal.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getStatusColor(goal.status)}`}>
                      {getStatusText(goal.status)}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getPriorityColor(goal.priority)}`}>
                      {getPriorityText(goal.priority)}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-purple-100 text-purple-800">
                      📚 {getDomains()[goal.domain]}
                    </span>
                    {goal.target_date && (
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
                        📅 {new Date(goal.target_date).toLocaleDateString(getDateLocale())}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg p-2 transition-all"
                  title="Sil"
                >
                  🗑️
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">İlerleme:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateProgress(goal.id, Math.max(0, goal.progress - 10))}
                    className="flex-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg text-sm font-medium transition-all text-gray-800"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(goal.id, Math.min(100, goal.progress + 10))}
                    className="flex-1 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-all"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(goal.id, 100)}
                    className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    ✅ Tamamla
                  </button>
                </div>
              </div>

              {goal.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Not:</span> {goal.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsSection;

