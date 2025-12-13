import React from 'react';
import { t } from '../constants.clean';

interface Props {
  navigate: (page: string, params?: any) => void;
}

const GettingStarted: React.FC<Props> = ({ navigate }) => {
  const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-[#1a1a2e] rounded-lg shadow p-6 border border-transparent dark:border-gray-700 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="mt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('gettingStarted')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('gettingStartedDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={t('step1Title')}>
          <p>{t('step1Desc')}</p>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1.5 rounded bg-primary hover:bg-indigo-700 text-white transition-colors" onClick={() => navigate('classes')}>{t('classes')}</button>
            <button className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors" onClick={() => navigate('children')}>{t('children')}</button>
          </div>
        </Card>

        <Card title={t('step2Title')}>
          <p>{t('step2Desc')}</p>
        </Card>

        <Card title={t('step3Title')}>
          <p>{t('step3Desc')}</p>
        </Card>

        <Card title={t('step4Title')}>
          <p>{t('step4Desc')}</p>
        </Card>

        <Card title={t('demoDataTip')}>
          <p>{t('demoDataDesc')}</p>
          <div className="mt-3">
            <button className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors" onClick={() => navigate('settings')}>{t('goToSettings')}</button>
          </div>
        </Card>

        <Card title={t('frequentActions')}>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('searchChildTip')}</li>
            <li>{t('exportDataTip')}</li>
            <li>{t('themeTip')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default GettingStarted;
