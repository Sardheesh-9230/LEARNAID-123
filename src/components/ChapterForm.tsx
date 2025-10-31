'use client'

import { useState } from 'react';
import { FiPlus, FiX, FiUpload, FiFile, FiFileText, FiImage, FiVideo } from 'react-icons/fi';

interface ChapterFormProps {
  isOpen: boolean;
  isEditMode: boolean;
  chapterData?: {
    _id?: string;
    title: string;
    chapterNumber: number;
    description: string;
    content: string;
    topics: string[];
    learningOutcomes: string[];
    estimatedDuration: number;
    status: 'Draft' | 'Published' | 'Archived';
  };
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
}

export default function ChapterForm({
  isOpen,
  isEditMode,
  chapterData,
  onClose,
  onSave,
  loading
}: ChapterFormProps) {
  const [formData, setFormData] = useState({
    title: chapterData?.title || '',
    chapterNumber: chapterData?.chapterNumber || 1,
    description: chapterData?.description || '',
    content: chapterData?.content || '',
    topics: chapterData?.topics || [],
    learningOutcomes: chapterData?.learningOutcomes || [],
    estimatedDuration: chapterData?.estimatedDuration || 1,
    status: chapterData?.status || 'Draft' as 'Draft' | 'Published' | 'Archived'
  });

  const [newTopic, setNewTopic] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  const addTopic = () => {
    if (newTopic.trim()) {
      setFormData({
        ...formData,
        topics: [...formData.topics, newTopic.trim()]
      });
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter((_: string, i: number) => i !== index)
    });
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setFormData({
        ...formData,
        learningOutcomes: [...formData.learningOutcomes, newOutcome.trim()]
      });
      setNewOutcome('');
    }
  };

  const removeOutcome = (index: number) => {
    setFormData({
      ...formData,
      learningOutcomes: formData.learningOutcomes.filter((_: string, i: number) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">
              {isEditMode ? '📝 Edit Chapter' : '✨ Create New Chapter'}
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              disabled={loading}
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chapter Number <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.chapterNumber}
                onChange={(e) => setFormData({...formData, chapterNumber: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏱️ Estimated Duration (hours) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                min="1"
                max="100"
                placeholder="e.g., 2 hours"
                required
              />
            </div>
          </div>

          {/* Chapter Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chapter Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="e.g., Introduction to Data Structures"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Short Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              rows={2}
              placeholder="Brief overview of what this chapter covers..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              rows={5}
              placeholder="Detailed explanation, key points, examples..."
            />
          </div>

          {/* Topics - Dynamic List */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📚 Topics Covered
            </label>
            <div className="space-y-2">
              {/* Existing Topics */}
              {formData.topics.map((topic: string, index: number) => (
                <div key={index} className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg group">
                  <span className="flex-1 text-gray-700">{topic}</span>
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
                    className="text-red-500 hover:bg-red-100 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ))}
              
              {/* Add New Topic */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Add a new topic and press Enter"
                />
                <button
                  type="button"
                  onClick={addTopic}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2"
                >
                  <FiPlus /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Learning Outcomes - Dynamic List */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🎯 Learning Outcomes
            </label>
            <div className="space-y-2">
              {/* Existing Outcomes */}
              {formData.learningOutcomes.map((outcome: string, index: number) => (
                <div key={index} className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg group">
                  <span className="flex-1 text-gray-700">{outcome}</span>
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    className="text-red-500 hover:bg-red-100 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ))}
              
              {/* Add New Outcome */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                  className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a learning outcome and press Enter"
                />
                <button
                  type="button"
                  onClick={addOutcome}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all flex items-center gap-2"
                >
                  <FiPlus /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-3">
              {(['Draft', 'Published', 'Archived'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, status})}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    formData.status === status
                      ? status === 'Draft'
                        ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                        : status === 'Published'
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-gray-50 border-gray-400 text-gray-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {status === 'Draft' && '📝 '}
                  {status === 'Published' && '✅ '}
                  {status === 'Archived' && '📦 '}
                  {status}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-8 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !formData.title}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              isEditMode ? '💾 Update Chapter' : '✨ Create Chapter'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
