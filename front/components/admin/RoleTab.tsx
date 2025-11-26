
import React, { useState } from 'react';
import { Role, Permission, User } from '../../types';
import { Shield, Edit, Trash2, Plus, X, Save, CheckSquare, Square, Users, LayoutGrid, Table as TableIcon, Copy } from 'lucide-react';
import { useConfig } from '../../ConfigContext';
import { SYSTEM_PERMISSIONS } from '../../data/mockData';

interface RoleTabProps {
    roles: Role[];
    users: User[];
    onUpdateRoles: (roles: Role[]) => void;
}

export const RoleTab: React.FC<RoleTabProps> = ({ roles, users, onUpdateRoles }) => {
    const { t } = useConfig();
    const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role>>({});

    // Group permissions by category
    const groupedPermissions = SYSTEM_PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const categories = Object.keys(groupedPermissions);

    const handleSaveRole = () => {
        if (!editingRole.name) return alert("Role name required");
        const newRole = {
            id: editingRole.id || `role-${Date.now()}`,
            name: editingRole.name,
            description: editingRole.description || '',
            permissionCodes: editingRole.permissionCodes || []
        } as Role;

        if (editingRole.id) {
            onUpdateRoles(roles.map(r => r.id === newRole.id ? newRole : r));
        } else {
            onUpdateRoles([...roles, newRole]);
        }
        setShowRoleModal(false);
    };

    const handleDeleteRole = (id: string) => {
        const userCount = users.filter(u => u.roleId === id).length;
        if (userCount > 0) {
            alert(`Cannot delete role. It is assigned to ${userCount} user(s).`);
            return;
        }
        if (confirm("Delete this role?")) onUpdateRoles(roles.filter(r => r.id !== id));
    };

    const handleCloneRole = (role: Role) => {
        const clonedRole: Role = {
            ...role,
            id: `role-${Date.now()}`,
            name: `${role.name} (Copy)`
        };
        onUpdateRoles([...roles, clonedRole]);
    };

    const togglePermission = (code: string) => {
        const current = editingRole.permissionCodes || [];
        if (current.includes(code)) {
            setEditingRole({ ...editingRole, permissionCodes: current.filter(c => c !== code) });
        } else {
            setEditingRole({ ...editingRole, permissionCodes: [...current, code] });
        }
    };

    const toggleCategory = (category: string) => {
        const categoryPerms = groupedPermissions[category].map(p => p.code);
        const current = editingRole.permissionCodes || [];
        const allSelected = categoryPerms.every(code => current.includes(code));

        if (allSelected) {
            // Deselect all in category
            setEditingRole({ ...editingRole, permissionCodes: current.filter(c => !categoryPerms.includes(c)) });
        } else {
            // Select all in category
            const missing = categoryPerms.filter(c => !current.includes(c));
            setEditingRole({ ...editingRole, permissionCodes: [...current, ...missing] });
        }
    };

    // Matrix View Helpers
    const updateRolePermission = (roleId: string, permCode: string, add: boolean) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        
        const newCodes = add 
            ? [...role.permissionCodes, permCode]
            : role.permissionCodes.filter(c => c !== permCode);
            
        onUpdateRoles(roles.map(r => r.id === roleId ? { ...r, permissionCodes: newCodes } : r));
    };

    return (
        <div className="h-full flex flex-col">
            {/* View Switcher Header */}
            <div className="flex justify-end mb-4">
                 <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                     <button 
                        onClick={() => setViewMode('cards')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-2 transition-all ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutGrid size={14}/><span>Cards</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('matrix')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-2 transition-all ${viewMode === 'matrix' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TableIcon size={14}/><span>Matrix</span>
                    </button>
                 </div>
            </div>

            {/* CARD VIEW */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pb-4">
                    {roles.map(role => {
                        const userCount = users.filter(u => u.roleId === role.id).length;
                        return (
                            <div key={role.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Shield size={24}/></div>
                                    <div className="flex space-x-1">
                                        <button onClick={() => handleCloneRole(role)} className="text-slate-400 hover:text-indigo-600 p-1" title="Clone Role"><Copy size={16}/></button>
                                        <button onClick={() => {setEditingRole(role); setShowRoleModal(true);}} className="text-slate-400 hover:text-blue-600 p-1" title="Edit Role"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteRole(role.id)} className="text-slate-400 hover:text-red-600 p-1" title="Delete Role"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800">{role.name}</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-4 flex-1">{role.description || "No description"}</p>
                                
                                <div className="flex items-center space-x-4 mt-auto pt-4 border-t border-slate-100">
                                    <div className="flex items-center text-xs text-slate-500" title="Assigned Users">
                                        <Users size={14} className="mr-1.5"/>
                                        <span className="font-medium">{userCount} Users</span>
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500" title="Permissions Count">
                                        <CheckSquare size={14} className="mr-1.5"/>
                                        <span className="font-medium">{role.permissionCodes.length} Perms</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => {setEditingRole({ permissionCodes: [] }); setShowRoleModal(true);}} className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors min-h-[200px] bg-slate-50/50">
                        <Plus size={32} className="mb-2"/>
                        <span className="font-medium">{t('admin.createRole')}</span>
                    </button>
                </div>
            )}

            {/* MATRIX VIEW */}
            {viewMode === 'matrix' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 border-b border-r border-slate-200 font-bold text-slate-600 min-w-[200px]">Permission / Role</th>
                                    {roles.map(role => (
                                        <th key={role.id} className="px-4 py-3 border-b border-slate-200 font-bold text-slate-800 text-center min-w-[100px]">
                                            <div className="flex flex-col items-center">
                                                <span>{role.name}</span>
                                                <span className="text-[10px] font-normal text-slate-400 mt-0.5">{users.filter(u => u.roleId === role.id).length} users</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {categories.map(category => (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-50/80">
                                            <td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                                                {category}
                                            </td>
                                        </tr>
                                        {groupedPermissions[category].map(perm => (
                                            <tr key={perm.code} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 border-r border-slate-100">
                                                    <div className="font-medium text-slate-700">{perm.name}</div>
                                                    <div className="text-[10px] text-slate-400">{perm.description}</div>
                                                </td>
                                                {roles.map(role => {
                                                    const hasPerm = role.permissionCodes.includes(perm.code);
                                                    return (
                                                        <td key={`${role.id}-${perm.code}`} className="px-4 py-2 text-center">
                                                            <button 
                                                                onClick={() => updateRolePermission(role.id, perm.code, !hasPerm)}
                                                                className={`p-1 rounded hover:bg-slate-200 transition-colors ${hasPerm ? 'text-blue-600' : 'text-slate-300'}`}
                                                            >
                                                                {hasPerm ? <CheckSquare size={18}/> : <Square size={18}/>}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EDIT MODAL (Shared) */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-lg text-slate-800">{editingRole.id ? t('admin.editRole') : t('admin.createRole')}</h3>
                            <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Basic Info */}
                            <div className="w-1/3 p-6 border-r border-slate-100 bg-slate-50 flex flex-col space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Name</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="e.g. Editor" value={editingRole.name || ''} onChange={e => setEditingRole({...editingRole, name: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                    <textarea className="w-full p-2 border border-slate-200 rounded text-sm h-32 resize-none" placeholder="Role description..." value={editingRole.description || ''} onChange={e => setEditingRole({...editingRole, description: e.target.value})}/>
                                </div>
                            </div>

                            {/* Right: Permissions Matrix */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-4">Permissions Configuration</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category} className="bg-white border border-slate-100 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-700 uppercase">{category}</span>
                                                <button onClick={() => toggleCategory(category)} className="text-xs text-blue-600 hover:underline">Toggle All</button>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {perms.map(perm => {
                                                    const isChecked = editingRole.permissionCodes?.includes(perm.code);
                                                    return (
                                                        <div key={perm.code} onClick={() => togglePermission(perm.code)} className="flex items-start space-x-2 cursor-pointer group">
                                                            <div className={`mt-0.5 ${isChecked ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                                                {isChecked ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-medium ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>{perm.name}</div>
                                                                <div className="text-[10px] text-slate-400">{perm.description}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex justify-end space-x-2 flex-shrink-0">
                            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancel</button>
                            <button onClick={handleSaveRole} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center space-x-2">
                                <Save size={16}/><span>Save Configuration</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
