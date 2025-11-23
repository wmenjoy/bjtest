import React, { useState } from 'react';
import { Organization } from '../../types';
import { Building, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface OrgTabProps {
    orgs: Organization[];
    onUpdateOrgs: (orgs: Organization[]) => void;
}

export const OrgTab: React.FC<OrgTabProps> = ({ orgs, onUpdateOrgs }) => {
    const { t } = useConfig();
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Partial<Organization>>({});

    const handleSaveOrg = () => {
        if (!editingOrg.name) return alert("Org name required");
        const newOrg = {
            id: editingOrg.id || `org-${Date.now()}`,
            name: editingOrg.name,
            type: editingOrg.type || 'department',
            parentId: editingOrg.parentId === 'none' ? undefined : (editingOrg.parentId || 'root')
        } as Organization;

        if (editingOrg.id) {
            onUpdateOrgs(orgs.map(o => o.id === newOrg.id ? newOrg : o));
        } else {
            onUpdateOrgs([...orgs, newOrg]);
        }
        setShowOrgModal(false);
    };

    const handleDeleteOrg = (id: string) => {
        if (confirm("Delete this organization?")) onUpdateOrgs(orgs.filter(o => o.id !== id));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex-1 overflow-y-auto relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">{t('admin.structure')}</h3>
                    <button onClick={() => {setEditingOrg({}); setShowOrgModal(true);}} className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm text-slate-600">
                        <Plus size={16}/><span>{t('admin.addUnit')}</span>
                    </button>
                </div>
                <div className="space-y-4">
                    {orgs.map(org => (
                        <div key={org.id} className="flex items-center group transition-all" style={{ marginLeft: org.parentId === 'root' ? 0 : org.parentId ? '2rem' : 0 }}>
                            <div className="relative">
                                {org.parentId && org.parentId !== 'root' && (
                                    <div className="absolute -left-4 top-1/2 w-4 h-px bg-slate-300"></div>
                                )}
                                {org.parentId && org.parentId !== 'root' && (
                                    <div className="absolute -left-4 -top-6 w-px h-10 bg-slate-300"></div>
                                )}
                                <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center mr-3 text-slate-500 border border-slate-200 z-10 relative">
                                    <Building size={16}/>
                                </div>
                            </div>
                            <div className="flex-1 p-3 border border-slate-200 rounded-lg flex justify-between items-center bg-white hover:border-blue-300 hover:shadow-sm transition-all">
                                <div>
                                    <span className="font-medium text-slate-700">{org.name}</span>
                                    <span className="text-[10px] text-slate-400 ml-2">ID: {org.id}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${org.type === 'department' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{org.type}</span>
                                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                                        <button onClick={() => {setEditingOrg(org); setShowOrgModal(true);}} className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"><Edit size={14}/></button>
                                        <button onClick={() => handleDeleteOrg(org.id)} className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {orgs.length === 0 && (
                        <div className="text-center text-slate-400 py-10">No organization structure defined.</div>
                    )}
                </div>
            </div>

            {showOrgModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">{editingOrg.id ? t('admin.editOrg') : t('admin.addUnit')}</h3>
                            <button onClick={() => setShowOrgModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="Department Name" value={editingOrg.name || ''} onChange={e => setEditingOrg({...editingOrg, name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={editingOrg.type || 'department'} onChange={e => setEditingOrg({...editingOrg, type: e.target.value as any})}>
                                    <option value="department">Department</option>
                                    <option value="team">Team</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Unit</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={editingOrg.parentId || 'root'} onChange={e => setEditingOrg({...editingOrg, parentId: e.target.value})}>
                                    <option value="root">Root (Top Level)</option>
                                    {orgs.filter(o => o.id !== editingOrg.id).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                            <button onClick={() => setShowOrgModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancel</button>
                            <button onClick={handleSaveOrg} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center space-x-2">
                                <Save size={16}/><span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};