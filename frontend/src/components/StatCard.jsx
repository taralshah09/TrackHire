import React from 'react';

const StatCard = ({ title, value, icon, iconColor, trend, trendValue, trendLabel }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
                    <span className={`material-icons ${iconColor.replace('bg-', 'text-')}`}>{icon}</span>
                </div>
            </div>
            <p className={`text-xs mt-4 flex items-center font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-slate-500'
                }`}>
                {trend === 'up' && <span className="material-icons text-xs mr-1">trending_up</span>}
                {trend === 'neutral' && <span className="material-icons text-xs mr-1">remove</span>}
                <span className="mr-1">{trendValue}</span> {trendLabel}
            </p>
        </div>
    );
};

export default StatCard;
