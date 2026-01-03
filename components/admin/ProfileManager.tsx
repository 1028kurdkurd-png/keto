import React, { useState } from 'react';
import { Plus, Trash2, Edit2, User, Facebook, Instagram, Video, MessageCircle, ArrowUp, ArrowDown, X, Check } from 'lucide-react';
import { Profile, TranslationStrings } from '../../types';
import MediaLibrary from './MediaLibrary';

interface ProfileManagerProps {
    profiles: Profile[];
    onAdd: (_p: Profile) => void;
    onUpdate: (_id: string, _p: Partial<Profile>) => void;
    onDelete: (_id: string) => void;
    t: TranslationStrings;
    isTeamSectionVisible: boolean;
    onToggleTeamSection: (_isActive: boolean) => void;
    roles: import('../../types').Role[];
    onAddRole: (_names: { ku: string, ar: string, fa: string, en: string }) => void;
    onUpdateRole: (_id: string, _updates: Partial<import('../../types').Role>) => void;
    onMoveRole: (_id: string, _direction: 'up' | 'down') => void;
    onDeleteRole: (_id: string) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAdd, onUpdate, onDelete, t, isTeamSectionVisible, onToggleTeamSection, roles, onAddRole, onUpdateRole, onMoveRole, onDeleteRole }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [activeLang, setActiveLang] = useState<import('../../types').Language>('ku');
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [newRoleNames, setNewRoleNames] = useState({ ku: '', ar: '', fa: '', en: '' });
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Profile>>({});

    const handleEdit = (profile: Profile) => {
        setEditingProfile(profile);
        setFormData(profile);
        setView('form');
    };

    const handleCreate = () => {
        setEditingProfile(null);
        setFormData({
            id: `prof_${Date.now()}`,
            isActive: true,
            name: '',
            image: '',
            phone: '',
            email: '',
            description: '',
            translations: {
                ku: { name: '', description: '' },
                ar: { name: '', description: '' },
                fa: { name: '', description: '' },
                en: { name: '', description: '' }
            },
            socials: { facebook: '', instagram: '', whatsapp: '', tiktok: '' },
            role: roles.length > 0 ? roles[roles.length - 1].id : ''
        });
        setView('form');
    };

    const handleSave = () => {
        if (!formData.name) return alert("Name is required");

        if (editingProfile) {
            onUpdate(editingProfile.id, formData);
        } else {
            onAdd(formData as Profile);
        }
        setView('list');
    };

    if (view === 'form') {
        return (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-[#c68a53] font-bold flex items-center gap-2">
                        ← {t.back}
                    </button>
                    <h2 className="text-2xl font-black">{editingProfile ? 'Edit Profile' : 'Add New Profile'}</h2>
                </div>

                <div className="bg-white p-8 rounded-[30px] shadow-lg border border-gray-100">
                    <div className="flex flex-col items-center mb-8">
                        <div
                            onClick={() => setMediaModalOpen(true)}
                            className="w-32 h-32 rounded-full bg-gray-100 border-4 border-[#c68a53] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                        >
                            {formData.image ? (
                                <img src={formData.image} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User size={40} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                        </div>
                        <span className="text-sm text-gray-400 mt-2 font-bold">Tap to upload photo</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Role Selection */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Select Role / Group</label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.role || (roles.length > 0 ? roles[roles.length - 1].id : '')}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 ring-[#c68a53]/20 outline-none"
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                <button onClick={() => setRoleModalOpen(true)} className="px-4 bg-[#231f20] text-white rounded-xl font-bold text-sm hover:opacity-80 transition-opacity whitespace-nowrap">
                                    Manage Roles
                                </button>
                            </div>
                        </div>

                        {/* Language Tabs */}
                        <div className="md:col-span-2 flex gap-2 bg-gray-50 p-1 rounded-xl mb-4">
                            {(['ku', 'ar', 'fa', 'en'] as const).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setActiveLang(lang)}
                                    className={`flex-1 py-2 rounded-lg font-black text-sm uppercase transition-all ${activeLang === lang ? 'bg-[#231f20] text-[#c68a53] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">
                                Full Name ({activeLang.toUpperCase()})
                            </label>
                            <input
                                value={formData.translations?.[activeLang]?.name || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        name: activeLang === 'ku' ? val : prev.name, // Sync fallback
                                        translations: {
                                            ...prev.translations,
                                            [activeLang]: { ...prev.translations?.[activeLang], name: val }
                                        } as any
                                    }));
                                }}
                                placeholder={`Enter name in ${activeLang.toUpperCase()}`}
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 ring-[#c68a53]/20 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-[#c68a53] rounded-full"></span>
                                {t.descriptionLabel} ({activeLang.toUpperCase()})
                            </label>
                            <textarea
                                value={formData.translations?.[activeLang]?.description || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        description: activeLang === 'ku' ? val : prev.description, // Sync fallback
                                        translations: {
                                            ...prev.translations,
                                            [activeLang]: { ...prev.translations?.[activeLang], description: val }
                                        } as any
                                    }));
                                }}
                                placeholder={`Write biography in ${activeLang.toUpperCase()}...`}
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 ring-[#c68a53]/20 outline-none min-h-[120px] resize-y text-gray-700 leading-relaxed custom-scrollbar shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                            <input
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="0750 000 0000"
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 ring-[#c68a53]/20 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                            <input
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="example@gmail.com"
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 ring-[#c68a53]/20 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <label className="text-sm font-black text-[#231f20]">Active Status</label>
                                <p className="text-xs text-gray-400 font-bold">Show this profile publicly</p>
                            </div>
                            <div
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        {/* Socials */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Facebook size={14} /> Facebook Link</label>
                                <input
                                    value={formData.socials?.facebook || ''}
                                    onChange={e => setFormData({ ...formData, socials: { ...formData.socials, facebook: e.target.value } })}
                                    placeholder="https://facebook.com/username"
                                    className="w-full p-4 pl-10 bg-blue-50/50 rounded-xl font-bold border-none focus:ring-2 ring-blue-500/20 outline-none text-blue-900"
                                />
                                <Facebook size={18} className="absolute left-3 top-9 text-blue-500" />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Instagram size={14} /> Instagram Link</label>
                                <input
                                    value={formData.socials?.instagram || ''}
                                    onChange={e => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })}
                                    placeholder="https://instagram.com/username"
                                    className="w-full p-4 pl-10 bg-pink-50/50 rounded-xl font-bold border-none focus:ring-2 ring-pink-500/20 outline-none text-pink-900"
                                />
                                <Instagram size={18} className="absolute left-3 top-9 text-pink-500" />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><MessageCircle size={14} /> WhatsApp Link</label>
                                <input
                                    value={formData.socials?.whatsapp || ''}
                                    onChange={e => setFormData({ ...formData, socials: { ...formData.socials, whatsapp: e.target.value } })}
                                    placeholder="https://wa.me/964750..."
                                    className="w-full p-4 pl-10 bg-green-50/50 rounded-xl font-bold border-none focus:ring-2 ring-green-500/20 outline-none text-green-900"
                                />
                                <MessageCircle size={18} className="absolute left-3 top-9 text-green-500" />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Video size={14} /> TikTok Link</label>
                                <input
                                    value={formData.socials?.tiktok || ''}
                                    onChange={e => setFormData({ ...formData, socials: { ...formData.socials, tiktok: e.target.value } })}
                                    placeholder="https://tiktok.com/@username"
                                    className="w-full p-4 pl-10 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 ring-black/20 outline-none text-black"
                                />
                                <Video size={18} className="absolute left-3 top-9 text-black" />
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6">
                            <button onClick={handleSave} className="w-full py-4 bg-[#231f20] text-[#c68a53] rounded-[20px] font-black text-xl shadow-xl hover:translate-y-[-2px] transition-all">
                                {t.save} Profile
                            </button>
                        </div>
                    </div>
                </div>

                {
                    mediaModalOpen && (
                        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-[30px] w-full max-w-4xl h-[80vh] overflow-hidden relative shadow-2xl">
                                <MediaLibrary
                                    isModal
                                    onClose={() => setMediaModalOpen(false)}
                                    onSelect={(img) => {
                                        setFormData({ ...formData, image: img.data });
                                        setMediaModalOpen(false);
                                    }}
                                    t={t}
                                />
                            </div>
                        </div>
                    )
                }

                {/* Role Management Modal */}
                {roleModalOpen && (
                    <div className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-[30px] w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-[#231f20] mb-6">Manage Roles / Groups</h2>

                            <div className="flex flex-col gap-3 mb-6">
                                {(['ku', 'ar', 'fa', 'en'] as const).map(lang => (
                                    <input
                                        key={lang}
                                        value={newRoleNames[lang]}
                                        onChange={(e) => setNewRoleNames({ ...newRoleNames, [lang]: e.target.value })}
                                        placeholder={`Role Name (${lang.toUpperCase()})`}
                                        className={`p-3 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 outline-none text-right placeholder:text-left dir-auto transition-all ${editingRoleId ? 'ring-blue-500/20 ring-2' : 'ring-[#c68a53]/20'}`}
                                        dir="auto"
                                    />
                                ))}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (editingRoleId) {
                                                const defaultName = newRoleNames.en || newRoleNames.ku || 'Role';
                                                onUpdateRole(editingRoleId, { name: defaultName, translations: newRoleNames });
                                                setNewRoleNames({ ku: '', ar: '', fa: '', en: '' });
                                                setEditingRoleId(null);
                                            } else {
                                                if (newRoleNames.ku || newRoleNames.en) {
                                                    onAddRole(newRoleNames);
                                                    setNewRoleNames({ ku: '', ar: '', fa: '', en: '' });
                                                } else {
                                                    alert("Please enter at least Kurdish or English name");
                                                }
                                            }
                                        }}
                                        className={`p-3 flex-1 text-white rounded-xl hover:opacity-80 font-bold flex items-center justify-center gap-2 mt-2 ${editingRoleId ? 'bg-blue-600' : 'bg-[#c68a53]'}`}
                                    >
                                        {editingRoleId ? <><Check size={18} /> Update Role</> : <><Plus size={18} /> Add New Role</>}
                                    </button>

                                    {editingRoleId && (
                                        <button
                                            onClick={() => {
                                                setNewRoleNames({ ku: '', ar: '', fa: '', en: '' });
                                                setEditingRoleId(null);
                                            }}
                                            className="p-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 font-bold mt-2"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {roles.map((role, idx) => (
                                    <div key={role.id} className={`flex items-center justify-between bg-gray-50 p-3 rounded-xl border ${editingRoleId === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <button
                                                    disabled={idx === 0}
                                                    onClick={() => onMoveRole(role.id, 'up')}
                                                    className="p-1 text-gray-400 hover:text-[#c68a53] disabled:opacity-30 disabled:hover:text-gray-400"
                                                >
                                                    <ArrowUp size={14} />
                                                </button>
                                                <button
                                                    disabled={idx === roles.length - 1}
                                                    onClick={() => onMoveRole(role.id, 'down')}
                                                    className="p-1 text-gray-400 hover:text-[#c68a53] disabled:opacity-30 disabled:hover:text-gray-400"
                                                >
                                                    <ArrowDown size={14} />
                                                </button>
                                            </div>
                                            <span className="font-bold text-[#231f20]">{role.name}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingRoleId(role.id);
                                                    setNewRoleNames({
                                                        ku: role.translations?.ku || '',
                                                        ar: role.translations?.ar || '',
                                                        fa: role.translations?.fa || '',
                                                        en: role.translations?.en || ''
                                                    });
                                                }}
                                                className="text-blue-400 hover:text-blue-600 p-2"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => { if (confirm("Are you sure? Delete role?")) onDeleteRole(role.id) }}
                                                className="text-red-400 hover:text-red-600 p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setRoleModalOpen(false)} className="w-full mt-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div >
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-6">
                <h2 className="text-3xl font-black text-[#231f20] flex items-center gap-3">
                    <User className="text-[#c68a53]" />
                    Profile Management
                </h2>
                <p className="text-gray-500">Manage team members and contact profiles.</p>
            </div>

            {/* Visibility Setting */}
            <div className="bg-white p-6 rounded-[22px] shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="font-black text-lg text-[#231f20]">Show Team Section on Menu</h3>
                    <p className="text-gray-400 text-sm font-bold">Enable to show the team section on the homepage.</p>
                </div>
                <div onClick={() => onToggleTeamSection(!isTeamSectionVisible)} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 relative ${isTeamSectionVisible ? 'bg-[#c68a53]' : 'bg-gray-200'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isTeamSectionVisible ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </div>

            <button onClick={handleCreate} className="w-full py-4 bg-[#231f20] text-[#c68a53] rounded-[22px] font-black flex items-center justify-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all">
                <Plus /> Add New Profile
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {profiles.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-gray-100 rounded-[24px] p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <User size={48} className="text-gray-200" />
                        <p className="font-bold">No profiles found. Add your first team member!</p>
                    </div>
                )}
                {profiles.map(profile => (
                    <div key={profile.id} className={`bg-white p-6 rounded-[24px] border ${!profile.isActive ? 'border-red-100 bg-red-50/10' : 'border-gray-100'} shadow-sm flex flex-col items-center gap-4 group hover:shadow-lg transition-all`}>
                        <div className="w-24 h-24 rounded-full border-4 border-[#c68a53]/20 overflow-hidden">
                            {profile.image ? <img src={profile.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><User size={32} /></div>}
                        </div>

                        <div className="text-center">
                            <h3 className="font-black text-xl text-[#231f20]">{profile.name}</h3>
                            <span className="text-gray-400 text-xs font-bold">{profile.phone}</span>
                        </div>

                        <div className="flex gap-2 w-full mt-2">
                            <button
                                onClick={() => onUpdate(profile.id, { isActive: !profile.isActive })}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold ${profile.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}
                            >
                                {profile.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <button onClick={() => handleEdit(profile)} className="p-2 bg-gray-100 hover:bg-[#c68a53] hover:text-white rounded-xl transition-colors">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => { if (confirm(t.deleteConfirm)) onDelete(profile.id) }} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
