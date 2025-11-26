
import React, { useState } from 'react';
import { Project, Organization } from '../../types';
import { FolderKanban, Plus, Edit, Trash2, X, Save, Search, Building2 } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface ProjectTabProps {
    projects: Project[];
    orgs: Organization[];
    onUpdateProjects: (projects: Project[]) => void;
}

export const ProjectTab: React.FC<ProjectTabProps> = ({ projects, orgs, onUpdateProjects }) => {
    const { t } = useConfig();
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Partial<Project>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrgId, setFilterOrgId] = useState<string>('ALL');

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.key.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOrg = filterOrgId === 'ALL' || p.orgId === filterOrgId;
        return matchesSearch && matchesOrg;
    });

    const handleSave = () => {
        if (!editingProject.name || !editingProject.key || !editingProject.orgId) {
            alert("Name, Key, and Organization are required.");
            return;
        }

        const newProject = {
            id: editingProject.id || `proj-${Date.now()}`,
            name: editingProject.name,
            key: editingProject.key.toUpperCase(),
            description: editingProject.description || '',
            orgId: editingProject.orgId
        } as Project;

        if (editingProject.id) {
            onUpdateProjects(projects.map(p => p.id === newProject.id ? newProject : p));
        } else {
            onUpdateProjects([...projects, newProject]);
        }
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this project? This may affect linked Test Cases and Runs.")) {
            onUpdateProjects(projects.filter(p => p.id !== id));
        }
    };

    const openModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
        } else {
            // Default to first org or current filter if specific
            const defaultOrg = filterOrgId !== 'ALL' ? filterOrgId : orgs[0]?.id;
            setEditingProject({ orgId: defaultOrg });
        }
        setShowModal(true);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search Projects..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterOrgId}
                        onChange={e => setFilterOrgId(e.target.value)}
                    >
                        <option value="ALL">All Organizations</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>
                <button onClick={() => openModal()} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium">
                    <Plus size={16}/><span>Add Project</span>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Project Name</th>
                            <th className="px-6 py-3">Key</th>
                            <th className="px-6 py-3">Organization</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredProjects.map(proj => {
                            const orgName = orgs.find(o => o.id === proj.orgId)?.name || 'Unknown Org';
                            return (
                                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 border border-indigo-100">
                                                <FolderKanban size={16}/>
                                            </div>
                                            <span className="font-bold text-slate-700">{proj.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{proj.key}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-slate-600">
                                            <Building2 size={14} className="mr-2 text-slate-400"/>
                                            {orgName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                                        {proj.description}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => openModal(proj)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(proj.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProjects.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No projects found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">{editingProject.id ? 'Edit Project' : 'New Project'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organization</label>
                                <select 
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white" 
                                    value={editingProject.orgId || ''} 
                                    onChange={e => setEditingProject({...editingProject, orgId: e.target.value})}
                                >
                                    <option value="" disabled>Select Organization...</option>
                                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Name</label>
                                    <input 
                                        className="w-full p-2 border border-slate-200 rounded text-sm" 
                                        placeholder="e.g. Mobile App" 
                                        value={editingProject.name || ''} 
                                        onChange={e => setEditingProject({...editingProject, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Key</label>
                                    <input 
                                        className="w-full p-2 border border-slate-200 rounded text-sm font-mono uppercase" 
                                        placeholder="MOB" 
                                        maxLength={4}
                                        value={editingProject.key || ''} 
                                        onChange={e => setEditingProject({...editingProject, key: e.target.value.toUpperCase()})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea 
                                    className="w-full p-2 border border-slate-200 rounded text-sm h-24 resize-none" 
                                    placeholder="Project purpose..." 
                                    value={editingProject.description || ''} 
                                    onChange={e => setEditingProject({...editingProject, description: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center space-x-2">
                                <Save size={16}/><span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
