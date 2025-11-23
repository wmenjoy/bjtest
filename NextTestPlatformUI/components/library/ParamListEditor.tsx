
import React from 'react';
import { ScriptParameter } from '../../types';
import { Trash2, Plus } from 'lucide-react';

interface ParamListEditorProps {
    items: ScriptParameter[];
    onChange: (items: ScriptParameter[]) => void;
    type: 'Input' | 'Output';
}

export const ParamListEditor: React.FC<ParamListEditorProps> = ({ items, onChange, type }) => {
    const add = () => onChange([...items, { name: `new_${type.toLowerCase()}`, type: 'string' }]);
    
    const update = (idx: number, field: keyof ScriptParameter, val: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[idx] = { ...newItems[idx], [field]: val };
        onChange(newItems);
    };
    
    const remove = (idx: number) => {
        const newItems = [...items];
        newItems.splice(idx, 1);
        onChange(newItems);
    };

    return (
        <div className="space-y-2">
            {items.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="flex-1 space-y-2">
                        <div className="flex space-x-2">
                            <input className="flex-1 p-1.5 border rounded text-sm font-mono" value={item.name} onChange={e => update(idx, 'name', e.target.value)} placeholder="Name"/>
                            <select className="w-24 p-1.5 border rounded text-sm" value={item.type} onChange={e => update(idx, 'type', e.target.value)}>
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="boolean">Bool</option>
                                <option value="object">Object</option>
                                <option value="array">Array</option>
                            </select>
                        </div>
                        <input className="w-full p-1.5 border rounded text-xs text-slate-600" value={item.description || ''} onChange={e => update(idx, 'description', e.target.value)} placeholder="Description (optional)"/>
                        {type === 'Input' && (
                            <input className="w-full p-1.5 border rounded text-xs text-slate-600 font-mono bg-white" value={item.defaultValue || ''} onChange={e => update(idx, 'defaultValue', e.target.value)} placeholder="Default Value"/>
                        )}
                    </div>
                    <button onClick={() => remove(idx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                </div>
            ))}
            <button onClick={add} className="w-full py-2 border-2 border-dashed border-slate-200 rounded text-slate-400 text-xs hover:border-blue-300 hover:text-blue-500 flex items-center justify-center">
                <Plus size={14} className="mr-1"/> Add {type}
            </button>
        </div>
    );
};
