import React from 'react';
import { t } from '../constants.clean';
import {
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface Props {
  navigate: (page: string, params?: any) => void;
}

const GettingStarted: React.FC<Props> = ({ navigate }) => {
  const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText?: string;
    buttonAction?: () => void;
    tips?: string[];
    highlight?: boolean;
  }> = ({ icon, title, description, buttonText, buttonAction, tips, highlight }) => (
    <div className={`bg-white dark:bg-[#1a1a2e] rounded-xl shadow-md p-5 border transition-all hover:shadow-lg ${highlight ? 'border-primary ring-2 ring-primary/20' : 'border-transparent dark:border-gray-700'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
          {tips && tips.length > 0 && (
            <ul className="mt-2 text-xs text-gray-500 dark:text-gray-500 space-y-1">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary">•</span> {tip}
                </li>
              ))}
            </ul>
          )}
          {buttonText && buttonAction && (
            <button
              onClick={buttonAction}
              className="mt-3 px-3 py-1.5 text-sm rounded-lg bg-primary hover:bg-indigo-700 text-white transition-colors"
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('gettingStarted')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">{t('gettingStartedDesc')}</p>
      </div>

      {/* Quick Start Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-primary" />
          {t('gsQuickStart')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-5 text-white">
            <div className="text-3xl font-bold mb-1">1</div>
            <div className="font-medium">{t('gsStep1Title')}</div>
            <p className="text-sm text-white/80 mt-1">{t('gsStep1Desc')}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
            <div className="text-3xl font-bold mb-1">2</div>
            <div className="font-medium">{t('gsStep2Title')}</div>
            <p className="text-sm text-white/80 mt-1">{t('gsStep2Desc')}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-5 text-white">
            <div className="text-3xl font-bold mb-1">3</div>
            <div className="font-medium">{t('gsStep3Title')}</div>
            <p className="text-sm text-white/80 mt-1">{t('gsStep3Desc')}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
            <div className="text-3xl font-bold mb-1">4</div>
            <div className="font-medium">{t('gsStep4Title')}</div>
            <p className="text-sm text-white/80 mt-1">{t('gsStep4Desc')}</p>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-primary" />
          {t('gsMainFeatures')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<UserGroupIcon className="w-5 h-5" />}
            title={t('gsClassManagement')}
            description={t('gsClassManagementDesc')}
            tips={[t('gsClassTip1'), t('gsClassTip2'), t('gsClassTip3')]}
            buttonText={t('gsViewClasses')}
            buttonAction={() => navigate('classes')}
          />

          <FeatureCard
            icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
            title={t('gsChildPortfolio')}
            description={t('gsChildPortfolioDesc')}
            tips={[t('gsChildTip1'), t('gsChildTip2'), t('gsChildTip3')]}
            buttonText={t('gsViewChildren')}
            buttonAction={() => navigate('children')}
          />

          <FeatureCard
            icon={<DocumentTextIcon className="w-5 h-5" />}
            title={t('gsObservations')}
            description={t('gsObservationsDesc')}
            tips={[t('gsObsTip1'), t('gsObsTip2')]}
            highlight
          />

          <FeatureCard
            icon={<PhotoIcon className="w-5 h-5" />}
            title={t('gsMediaPhotos')}
            description={t('gsMediaDesc')}
            tips={[t('gsMediaTip1'), t('gsMediaTip2'), t('gsMediaTip3')]}
          />
        </div>
      </div>

      {/* Communication Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
          {t('gsCommunication')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            title={t('gsParentMessaging')}
            description={t('gsParentMessagingDesc')}
            tips={[t('gsMsgTip1'), t('gsMsgTip2'), t('gsMsgTip3')]}
            buttonText={t('gsViewMessages')}
            buttonAction={() => navigate('inbox')}
          />

          <FeatureCard
            icon={<MegaphoneIcon className="w-5 h-5" />}
            title={t('gsAnnouncements')}
            description={t('gsAnnouncementsDesc')}
            tips={[t('gsAnnTip1'), t('gsAnnTip2'), t('gsAnnTip3')]}
            buttonText={t('gsGoToAnnouncements')}
            buttonAction={() => navigate('announcements')}
          />
        </div>
      </div>

      {/* Tracking & Reports */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-primary" />
          {t('gsTracking')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<CalendarDaysIcon className="w-5 h-5" />}
            title={t('gsAttendance')}
            description={t('gsAttendanceDesc')}
            tips={[t('gsAttTip1'), t('gsAttTip2'), t('gsAttTip3')]}
            buttonText={t('gsGoToAttendance')}
            buttonAction={() => navigate('attendance')}
          />

          <FeatureCard
            icon={<ChartBarIcon className="w-5 h-5" />}
            title={t('gsSkillReport')}
            description={t('gsSkillReportDesc')}
            tips={[t('gsReportTip1'), t('gsReportTip2'), t('gsReportTip3')]}
            highlight
          />

          <FeatureCard
            icon={<ArrowDownTrayIcon className="w-5 h-5" />}
            title={t('gsDataExport')}
            description={t('gsDataExportDesc')}
            tips={[t('gsExportTip1'), t('gsExportTip2')]}
          />
        </div>
      </div>

      {/* Demo Data & Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Cog6ToothIcon className="w-5 h-5 text-primary" />
          {t('gsSettingsDemo')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<SparklesIcon className="w-5 h-5" />}
            title={t('gsDemoData')}
            description={t('gsDemoDataDesc')}
            tips={[t('gsDemoTip1'), t('gsDemoTip2'), t('gsDemoTip3')]}
            buttonText={t('goToSettings')}
            buttonAction={() => navigate('settings')}
          />

          <FeatureCard
            icon={<Cog6ToothIcon className="w-5 h-5" />}
            title={t('gsProfilePrefs')}
            description={t('gsProfilePrefsDesc')}
            tips={[t('gsPrefTip1'), t('gsPrefTip2'), t('gsPrefTip3')]}
          />
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-orange-500/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💡 {t('gsProTips')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-medium">•</span>
            <span><strong>{t('gsQuickSearch')}</strong> {t('gsQuickSearchDesc')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-medium">•</span>
            <span><strong>{t('gsKeyboardShortcuts')}</strong> {t('gsKeyboardDesc')}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-medium">•</span>
            <span><strong>{t('gsMobileApp')}</strong> {t('gsMobileAppDesc')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
