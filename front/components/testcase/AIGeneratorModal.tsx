
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
    isGenerating: boolean;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose, onGenerate, isGenerating }) => {
    const { t } = useConfig();
    const [aiPrompt, setAiPrompt] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 transform transition-all scale-100">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{t('testCase.aiGenerator')}</h3>
                        <p className="text-sm text-slate-500">{t('testCase.describe')}</p>
                    </div>
                </div>

                <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl mb-6 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-slate-50"
                    rows={4}
                    placeholder="e.g. Verify that a user cannot login with an invalid password, ensuring an error message is displayed..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                />

                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">{t('testCase.cancel')}</button>
                    <button
                        onClick={() => onGenerate(aiPrompt)}
                        disabled={!aiPrompt || isGenerating}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={16} />}
                        <span>{t('testCase.generate')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
