import React from 'react';
import { t } from '../constants.clean';
import {
    HomeIcon,
    UsersIcon,
    AcademicCapIcon,
    PlusIcon,
    CalendarDaysIcon,
    ChatBubbleBottomCenterTextIcon,
    Cog6ToothIcon,
    MegaphoneIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    AcademicCapIcon as AcademicCapIconSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
    ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
    MegaphoneIcon as MegaphoneIconSolid,
    ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid
} from '@heroicons/react/24/solid';

const MagicArrowIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18.75l6-6 2.25 2.25 7.5-7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.5l-1.12-2.63L15.75 3.75l2.63-1.12L19.5 0l1.13 2.63 2.62 1.12-2.62 1.13L19.5 7.5z" transform="translate(1 3) scale(0.8)" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22.5 7.5l-1.5-1.5-1.5 1.5 1.5 1.5 1.5-1.5z" className="hidden" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75l1.12 2.62 2.63 1.13-2.63 1.12-1.12 2.63-1.13-2.63-2.62-1.12 2.62-1.13 1.13-2.62z" />
    </svg>
);

interface MobileTabBarProps {
    currentPath: string;
    navigate: (path: string) => void;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentPath, navigate }) => {
    const tabs = [
        { name: t('navHome'), path: '', icon: HomeIcon, activeIcon: HomeIconSolid },
        { name: t('navChildren'), path: 'children', icon: UsersIcon, activeIcon: UsersIconSolid },
        { name: t('classes'), path: 'classes', icon: AcademicCapIcon, activeIcon: AcademicCapIconSolid },
        { name: t('announcements'), path: 'announcements', icon: MegaphoneIcon, activeIcon: MegaphoneIconSolid },
        { name: '', path: 'add-observation', icon: PlusIcon, isFab: true },
        { name: t('messages'), path: 'inbox', icon: ChatBubbleLeftRightIcon, activeIcon: ChatBubbleLeftRightIconSolid },
        { name: t('navAttendance'), path: 'attendance', icon: CalendarDaysIcon, activeIcon: CalendarDaysIconSolid },
        { name: 'AI', path: 'teacher-chat', icon: MagicArrowIcon },
        { name: t('navSettings'), path: 'settings', icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid },
    ];

    const getIsActive = (path: string) => {
        if (path === '') return currentPath === '' || currentPath === 'dashboard';
        return currentPath.startsWith(path);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-200"></div>

            {/* Content */}
            <div className="relative flex justify-between items-end pb-safe pt-1 px-1 h-[80px] w-full overflow-x-auto no-scrollbar gap-1 pb-2">
                {tabs.map((tab) => {
                    const isActive = !tab.isFab && getIsActive(tab.path);
                    const Icon = isActive ? (tab.activeIcon || tab.icon) : tab.icon;

                    if (tab.isFab) {
                        return (
                            <button
                                key="fab"
                                onClick={() => navigate(tab.path)}
                                className="flex flex-col items-center justify-center -mt-5 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 flex items-center justify-center transform transition-transform duration-200 group-active:scale-95 border-4 border-white/50">
                                    <PlusIcon className="w-6 h-6 text-white stroke-[2.5]" />
                                </div>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.name}
                            onClick={() => navigate(tab.path)}
                            className={`flex-1 flex flex-col items-center justify-center pb-1 pt-1 transition-all ${isActive ? 'flex-[1.5]' : 'flex-1'} active:scale-95`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm relative -top-1' : 'text-gray-400'}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            {isActive && (
                                <span className="text-[10px] font-bold text-indigo-600 mt-0.5 animate-fade-in whitespace-nowrap">
                                    {tab.name}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileTabBar;
