
import React, { useState } from 'react';
import { X, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { FieldSpec } from './constants';

// Key-Value List Editor
export const KVEditor: React.FC<{ data: Record<string, string>, onChange: (d: Record<string, string>) => void }> = ({ data, onChange }) => {
    const entries = Object.entries(data || {});
    const update = (idx: number, key: string, val: string) => {
        const newEntries = [...entries];
        newEntries[idx] = [key, val];
        onChange(Object.fromEntries(newEntries));
    };
    const remove = (idx: number) => {
        const newEntries = [...entries];
        newEntries.splice(idx, 1);
        onChange(Object.fromEntries(newEntries));
    };
    const add = () => onChange({ ...data, "": "" });

    return (
        <div className="space-y-1">
            {entries.map(([k, v], i) => (
                <div key={i} className="flex space-x-1">
                    <input className="flex-1 p-1 text-xs border rounded bg-slate-50" value={k} onChange={e => update(i, e.target.value, v)} placeholder="Key" />
                    <input className="flex-1 p-1 text-xs border rounded bg-slate-50" value={v} onChange={e => update(i, k, e.target.value)} placeholder="Value" />
                    <button onClick={() => remove(i)} className="p-1 text-slate-400 hover:text-red-500"><X size={12} /></button>
                </div>
            ))}
            <button onClick={add} className="text-[10px] text-blue-600 hover:underline flex items-center"><Plus size={10} className="mr-1"/> Add Item</button>
        </div>
    );
};

// Data Context Tree Item
export const TreeItem: React.FC<{ label: string, data: any, path: string, onInsert: (val: string) => void, level?: number }> = ({ label, data, path, onInsert, level = 0 }) => {
    const [expanded, setExpanded] = useState(false);
    const isObj = typeof data === 'object' && data !== null;
    const typeLabel = Array.isArray(data) ? '[ ]' : isObj ? '{ }' : typeof data;
    
    return (
        <div className={`text-xs font-mono select-none`}>
            <div 
                className={`flex items-center py-0.5 px-1 hover:bg-blue-50 rounded cursor-pointer group ${level > 0 ? 'ml-3 border-l border-slate-200' : ''}`}
                onClick={(e) => { e.stopPropagation(); if(isObj) setExpanded(!expanded); else onInsert(`{{${path}}}`); }}
            >
                {isObj && (
                    <button className="mr-1 text-slate-400">
                        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </button>
                )}
                <span className={`mr-2 ${isObj ? 'text-slate-600 font-bold' : 'text-green-600'}`}>{label}</span>
                <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100">{typeLabel}</span>
            </div>
            {expanded && isObj && (
                <div>
                    {Object.entries(data).map(([k, v]) => (
                        <TreeItem key={k} label={k} data={v} path={`${path}.${k}`} onInsert={onInsert} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Smart Input Field
export const SmartField: React.FC<{
    spec: FieldSpec;
    value: any;
    onChange: (val: any) => void;
    activeSetter: (fn: (val: string) => void) => void;
}> = ({ spec, value, onChange, activeSetter }) => {
    const [isExpression, setIsExpression] = useState(false);

    const handleFocus = () => {
        activeSetter((variable: string) => {
            const current = typeof value === 'string' ? value : JSON.stringify(value);
            onChange(current + variable);
            setIsExpression(true);
        });
    };

    const renderInput = () => {
        if (isExpression) {
            return (
                <textarea
                    className="w-full p-2 text-xs font-mono border border-blue-300 rounded bg-blue-50/20 focus:ring-2 focus:ring-blue-200 outline-none min-h-[60px]"
                    value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
                    onChange={e => onChange(e.target.value)}
                    onFocus={handleFocus}
                    placeholder="Type or click variable on left..."
                />
            );
        }

        switch (spec.type) {
            case 'select':
                return (
                    <select className="w-full p-2 text-sm border border-slate-200 rounded bg-white" value={value || ''} onChange={e => onChange(e.target.value)}>
                        <option value="" disabled>Select...</option>
                        {spec.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                );
            case 'boolean':
                return <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />;
            case 'number':
                return <input type="number" className="w-full p-2 text-sm border border-slate-200 rounded" value={value || ''} onChange={e => onChange(Number(e.target.value))} onFocus={handleFocus} />;
            case 'kv-list':
                return <KVEditor data={value || {}} onChange={onChange} />;
            case 'json':
                return <textarea className="w-full p-2 text-xs font-mono border border-slate-200 rounded h-24" value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)} onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); } }} onFocus={handleFocus} placeholder="{ ... }" />;
            case 'code':
                return <textarea className="w-full p-2 text-xs font-mono border border-slate-200 rounded bg-slate-900 text-green-400 h-32" value={value || ''} onChange={e => onChange(e.target.value)} onFocus={handleFocus} placeholder={spec.placeholder} />;
            default:
                return <input type="text" className="w-full p-2 text-sm border border-slate-200 rounded" value={value || ''} onChange={e => onChange(e.target.value)} onFocus={handleFocus} placeholder={spec.placeholder} />;
        }
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-600 uppercase">{spec.label}</label>
                <button 
                    onClick={() => setIsExpression(!isExpression)}
                    className={`text-[10px] font-bold px-1.5 rounded transition-colors ${isExpression ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                    title="Toggle Expression Mode"
                >
                    ƒx
                </button>
            </div>
            {renderInput()}
            {spec.description && <p className="text-[10px] text-slate-400 mt-1">{spec.description}</p>}
        </div>
    );
};
