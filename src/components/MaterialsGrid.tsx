'use client'

import { useState } from 'react';
import { FiDownload, FiEye, FiTrash2, FiFileText, FiFile, FiImage, FiVideo, FiLink, FiExternalLink, FiZap } from 'react-icons/fi';

interface Material {
  _id: string;
  chapter: string;
  subject: string;
  title: string;
  type: 'PDF' | 'Video' | 'Link' | 'Document' | 'PPT' | 'Image';
  url?: string;
  fileMetadata?: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  order: number;
  duration?: number;
  viewCount: number;
  downloadCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface MaterialsGridProps {
  materials: Material[];
  onDownload: (materialId: string) => void;
  onDelete: (materialId: string) => void;
  onView: (material: Material) => void;
  onGenerateMCQ?: (materialId: string) => void;
  canEdit: boolean;
}

export default function MaterialsGrid({
  materials,
  onDownload,
  onDelete,
  onView,
  onGenerateMCQ,
  canEdit
}: MaterialsGridProps) {
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FiFileText className="text-red-500" size={32} />;
      case 'PPT': return <FiFile className="text-orange-500" size={32} />;
      case 'Document': return <FiFileText className="text-blue-500" size={32} />;
      case 'Image': return <FiImage className="text-green-500" size={32} />;
      case 'Video': return <FiVideo className="text-purple-500" size={32} />;
      case 'Link': return <FiLink className="text-indigo-500" size={32} />;
      default: return <FiFile className="text-gray-500" size={32} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-red-100 text-red-700';
      case 'PPT': return 'bg-orange-100 text-orange-700';
      case 'Document': return 'bg-blue-100 text-blue-700';
      case 'Image': return 'bg-green-100 text-green-700';
      case 'Video': return 'bg-purple-100 text-purple-700';
      case 'Link': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const types = ['All', 'PDF', 'PPT', 'Document', 'Image', 'Video', 'Link'];

  const filteredMaterials = materials.filter(material => {
    const matchesFilter = filter === 'All' || material.type === filter;
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.fileMetadata?.originalName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === type
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type} {type === 'All' ? `(${materials.length})` : `(${materials.filter(m => m.type === type).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search materials..."
            className="w-full md:w-64 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => (
            <div
              key={material._id}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-xl transition-all group"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex items-center justify-center h-32 relative">
                {material.type === 'Image' && material.url ? (
                  <img
                    src={material.url}
                    alt={material.title}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  getFileIcon(material.type)
                )}
                
                {/* Type Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(material.type)}`}>
                    {material.type}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <h4 className="font-bold text-gray-800 text-lg line-clamp-2 min-h-[3.5rem]">
                  {material.title}
                </h4>

                {/* File Info */}
                {material.fileMetadata && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {material.fileMetadata.originalName} • {(material.fileMetadata.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}

                {/* Tags */}
                {material.tags && material.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {material.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {material.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{material.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-200">
                  <span className="flex items-center gap-1">
                    <FiEye size={14} /> {material.viewCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiDownload size={14} /> {material.downloadCount || 0}
                  </span>
                </div>

                {/* Upload Info */}
                {material.createdAt && (
                  <div className="text-xs text-gray-400">
                    Uploaded {new Date(material.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2 flex-wrap">
                {/* View/Open Button */}
                {material.type === 'Link' ? (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <FiExternalLink size={16} /> Open Link
                  </a>
                ) : (
                  <button
                    onClick={() => onView(material)}
                    className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <FiEye size={16} /> View
                  </button>
                )}

                {/* Download Button */}
                {material.type !== 'Link' && (
                  <button
                    onClick={() => onDownload(material._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 font-medium"
                    title="Download"
                  >
                    <FiDownload size={16} />
                  </button>
                )}

                {/* Generate MCQ Button (only for PDF files) */}
                {material.type === 'PDF' && onGenerateMCQ && canEdit && (
                  <button
                    onClick={() => onGenerateMCQ(material._id)}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 font-medium"
                    title="Generate MCQs with AI"
                  >
                    <FiZap size={16} />
                  </button>
                )}

                {/* Delete Button (only if canEdit) */}
                {canEdit && (
                  <button
                    onClick={() => onDelete(material._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 font-medium"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-gray-400 mb-4">
            <FiFile size={64} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Materials Found</h3>
          <p className="text-gray-500">
            {searchQuery || filter !== 'All'
              ? 'Try adjusting your search or filters'
              : 'No materials have been uploaded yet'}
          </p>
        </div>
      )}
    </div>
  );
}
