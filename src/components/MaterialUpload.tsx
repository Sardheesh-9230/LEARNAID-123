

'use client'

import { useState, useRef } from 'react';
import { FiUpload, FiFile, FiFileText, FiImage, FiVideo, FiX, FiCheck, FiLink } from 'react-icons/fi';

interface MaterialFile {
  id: string;
  file?: File;
  url?: string;
  type: 'PDF' | 'Video' | 'Link' | 'Document' | 'PPT' | 'Image';
  title: string;
  tags: string[];
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
  progress?: number;
}

interface MaterialUploadProps {
  isOpen: boolean;
  chapterId: string;
  chapterTitle: string;
  onClose: () => void;
  onUploadComplete: () => void;
  loading: boolean;
}

export default function MaterialUpload({
  isOpen,
  chapterId,
  chapterTitle,
  onClose,
  onUploadComplete,
  loading
}: MaterialUploadProps) {
  const [materials, setMaterials] = useState<MaterialFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FiFileText className="text-red-500" size={24} />;
      case 'PPT': return <FiFile className="text-orange-500" size={24} />;
      case 'Document': return <FiFileText className="text-blue-500" size={24} />;
      case 'Image': return <FiImage className="text-green-500" size={24} />;
      case 'Video': return <FiVideo className="text-purple-500" size={24} />;
      case 'Link': return <FiLink className="text-indigo-500" size={24} />;
      default: return <FiFile className="text-gray-500" size={24} />;
    }
  };

  const getFileType = (fileName: string): MaterialFile['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return 'PDF';
    if (['ppt', 'pptx'].includes(ext || '')) return 'PPT';
    if (['doc', 'docx', 'txt'].includes(ext || '')) return 'Document';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'Image';
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext || '')) return 'Video';
    return 'Document';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newMaterials: MaterialFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: getFileType(file.name),
      title: file.name.split('.').slice(0, -1).join('.'),
      tags: [],
      uploading: false,
      uploaded: false
    }));
    
    setMaterials([...materials, ...newMaterials]);
  };

  const handleAddLink = () => {
    if (linkUrl && linkTitle) {
      const newMaterial: MaterialFile = {
        id: `link-${Date.now()}`,
        url: linkUrl,
        type: 'Link',
        title: linkTitle,
        tags: [],
        uploading: false,
        uploaded: false
      };
      
      setMaterials([...materials, newMaterial]);
      setLinkUrl('');
      setLinkTitle('');
      setShowLinkInput(false);
    }
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterialTitle = (id: string, title: string) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, title } : m
    ));
  };

  const updateMaterialTags = (id: string, tags: string) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, tags: tags.split(',').map(t => t.trim()).filter(t => t) } : m
    ));
  };

  const handleUploadAll = async () => {
    // This will be called from parent component with actual upload logic
    onUploadComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">📤 Upload Chapter Materials</h3>
              <p className="text-indigo-100 mt-1">Chapter: {chapterTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <FiUpload className="mx-auto text-gray-400 mb-4" size={48} />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              Drag & Drop Files Here
            </h4>
            <p className="text-gray-500 mb-4">
              or click to browse files
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-all font-medium shadow-md"
              >
                📁 Browse Files
              </button>
              <button
                onClick={() => setShowLinkInput(true)}
                className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-all font-medium shadow-md"
              >
                🔗 Add Link
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
            />
            <p className="text-xs text-gray-400 mt-4">
              Supported: PDF, PPT, DOCX, Images, Videos (Max 50MB per file)
            </p>
          </div>

          {/* Link Input Modal */}
          {showLinkInput && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-purple-900">🔗 Add External Link</h4>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Link Title (e.g., YouTube Video)"
              />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/resource"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddLink}
                  className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all"
                  disabled={!linkUrl || !linkTitle}
                >
                  Add Link
                </button>
                <button
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                    setLinkTitle('');
                  }}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Materials List */}
          {materials.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                📚 Materials to Upload ({materials.length})
              </h4>
              
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getFileIcon(material.type)}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 space-y-3">
                      {/* Title Input */}
                      <input
                        type="text"
                        value={material.title}
                        onChange={(e) => updateMaterialTitle(material.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder="Material title"
                      />

                      {/* File Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                          {material.type}
                        </span>
                        {material.file && (
                          <span>{formatFileSize(material.file.size)}</span>
                        )}
                        {material.url && (
                          <span className="flex items-center gap-1">
                            <FiLink size={14} /> External Link
                          </span>
                        )}
                      </div>

                      {/* Tags Input */}
                      <input
                        type="text"
                        onChange={(e) => updateMaterialTags(material.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="Tags (comma-separated)"
                      />

                      {/* Progress Bar (if uploading) */}
                      {material.uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full transition-all duration-300"
                            style={{ width: `${material.progress || 0}%` }}
                          />
                        </div>
                      )}

                      {/* Status */}
                      {material.uploaded && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <FiCheck /> Uploaded Successfully
                        </div>
                      )}
                      {material.error && (
                        <div className="text-red-600 text-sm">{material.error}</div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeMaterial(material.id)}
                      className="flex-shrink-0 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                      disabled={material.uploading}
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {materials.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiUpload size={48} className="mx-auto mb-4 opacity-50" />
              <p>No materials added yet</p>
              <p className="text-sm">Drag files here or click "Browse Files"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {materials.length > 0 && (
              <span className="font-medium">{materials.length} file(s) ready to upload</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleUploadAll}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || materials.length === 0}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload /> Upload All Materials
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
