
import React, { useState } from 'react';
import { User, Role, Organization } from '../../types';
import { Search, Plus, CheckCircle, XCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface UserTabProps {
    users: User[];
    roles: Role[];
    orgs: Organization[];
    onUpdateUsers: (users: User[]) => void;
}

export const UserTab: React.FC<UserTabProps> = ({ users, roles, orgs, onUpdateUsers }) => {
    const { t } = useConfig();
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveUser = () => {
        if (!editingUser.name || !editingUser.email) return alert("Name and Email required");
        const newUser = {
            id: editingUser.id || `u-${Date.now()}`,
            name: editingUser.name,
            email: editingUser.email,
            roleId: editingUser.roleId || roles[0]?.id || 'admin',
            orgId: editingUser.orgId || orgs[0]?.id || 'root',
            status: editingUser.status || 'active',
            avatar: editingUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editingUser.name}`
        } as User;

        if (editingUser.id) {
            onUpdateUsers(users.map(u => u.id === newUser.id ? newUser : u));
        } else {
            onUpdateUsers([...users, newUser]);
        }
        setShowUserModal(false);
    };

    const handleDeleteUser = (id: string) => {
        if (confirm("Delete this user?")) onUpdateUsers(users.filter(u => u.id !== id));
    };
    
    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('admin.searchUsers')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={() => {setEditingUser({}); setShowUserModal(true);}} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium">
                    <Plus size={16}/><span>{t('admin.addUser')}</span>
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">{t('admin.role')}</th>
                            <th className="px-6 py-3">{t('admin.org')}</th>
                            <th className="px-6 py-3">{t('admin.status')}</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200"/>
                                    <div>
                                        <div className="font-bold text-slate-800">{user.name}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">
                                        {roles.find(r => r.id === user.roleId)?.name || user.roleId}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {orgs.find(o => o.id === user.orgId)?.name || user.orgId}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center text-xs font-bold ${user.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                                        {user.status === 'active' ? <CheckCircle size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>}
                                        {user.status === 'active' ? t('admin.active') : t('admin.inactive')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => {setEditingUser(user); setShowUserModal(true);}} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showUserModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">{editingUser.id ? t('admin.editUser') : t('admin.addUser')}</h3>
                            <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="Full Name" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                    <input className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="Email Address" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                                    <select className="w-full p-2 border border-slate-200 rounded text-sm" value={editingUser.roleId || ''} onChange={e => setEditingUser({...editingUser, roleId: e.target.value})}>
                                        <option value="" disabled>Select Role...</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organization</label>
                                    <select className="w-full p-2 border border-slate-200 rounded text-sm" value={editingUser.orgId || ''} onChange={e => setEditingUser({...editingUser, orgId: e.target.value})}>
                                        <option value="" disabled>Select Org...</option>
                                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={editingUser.status || 'active'} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                            <button onClick={() => setShowUserModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancel</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center space-x-2">
                                <Save size={16}/><span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
