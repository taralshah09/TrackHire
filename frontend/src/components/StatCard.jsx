import React from 'react';

export default function StatCard({ title, value, icon }) {
    return (
        <div className="bg-pure-white border-[4px] border-brutalist-black p-8 shadow-[4px_4px_0px_0px_#060608] flex flex-col gap-4 transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#060608]" style={{"padding":"32px"}}>
            <div className="flex items-center justify-between">
                <p className="font-label-mono font-bold uppercase text-sm text-brutalist-black m-0">
                    {title}
                </p>
                {icon && (
                    <div className="w-12 h-12 bg-[#F4F4F5] border-[3px] border-brutalist-black flex items-center justify-center text-2xl text-brutalist-black shadow-[2px_2px_0px_0px_#060608]">
                        {icon}
                    </div>
                )}
            </div>
            <p className="font-headline-md font-black uppercase tracking-tighter text-5xl text-brutalist-black m-0 mt-2">
                {value ?? 0}
            </p>
        </div>
    );
}
