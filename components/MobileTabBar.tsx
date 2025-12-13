import React from 'react';
import {
    HomeIcon,
    UsersIcon,
    AcademicCapIcon,
    PlusIcon,
    CalendarDaysIcon,
    ChatBubbleBottomCenterTextIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    AcademicCapIcon as AcademicCapIconSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
    ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';

interface MobileTabBarProps {
    currentPath: string;
    navigate: (path: string) => void;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentPath, navigate }) => {
    const tabs = [
        { name: 'Ana', path: '', icon: HomeIcon, activeIcon: HomeIconSolid },
        { name: 'Çocuk', path: 'children', icon: UsersIcon, activeIcon: UsersIconSolid },
        { name: 'Sınıf', path: 'classes', icon: AcademicCapIcon, activeIcon: AcademicCapIconSolid },
        { name: '', path: 'add-observation', icon: PlusIcon, isFab: true },
        { name: 'Devam', path: 'attendance', icon: CalendarDaysIcon, activeIcon: CalendarDaysIconSolid },
        { name: 'AI', path: 'teacher-chat', icon: ChatBubbleBottomCenterTextIcon, activeIcon: ChatBubbleBottomCenterTextIconSolid },
        { name: 'Ayar', path: 'settings', icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid },
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
            <div className="relative flex justify-around items-end pb-safe pt-1 px-1 h-[72px] w-full">
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
                            className="flex-1 flex flex-col items-center justify-center pb-1 pt-1 active:scale-95 transition-transform max-w-[60px]"
                        >
                            <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[9px] font-medium mt-0.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {tab.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileTabBar;

