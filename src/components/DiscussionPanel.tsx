'use client'

import { useState, useEffect, useRef } from 'react'
import {
  FiMessageCircle, FiSend, FiX, FiChevronLeft,
  FiPlus, FiBookmark, FiCheck, FiTrash2, FiRefreshCw,
  FiUser, FiClock
} from 'react-icons/fi'
import apiService from '@/services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Reply {
  _id: string
  author: string
  authorName: string
  authorRole: string
  text: string
  createdAt: string
}

interface Discussion {
  _id: string
  title: string
  content: string
  subject: string
  subjectName: string
  author: string
  authorName: string
  authorRole: string
  replies: Reply[]
  status: 'open' | 'closed' | 'resolved'
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

interface Subject {
  _id: string
  name: string
  code: string
}

interface DiscussionPanelProps {
  /** The subjects this user can select from */
  subjects: Subject[]
  /** 'Student' = can post + reply; 'Faculty' = can also pin/resolve/delete */
  userRole: 'Student' | 'Faculty' | 'Staff' | 'Admin'
  /** Current logged-in user id (for ownership checks on delete) */
  currentUserId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string | undefined | null) {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Unknown'
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const roleColor: Record<string, string> = {
  Faculty: 'bg-indigo-100 text-indigo-700',
  Student: 'bg-blue-100 text-blue-700',
  Admin: 'bg-red-100 text-red-700',
  Staff: 'bg-gray-100 text-gray-700'
}

const statusBadge: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  resolved: 'bg-teal-100 text-teal-700'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiscussionPanel({ subjects, userRole, currentUserId }: DiscussionPanelProps) {
  const isFaculty = ['Faculty', 'Admin', 'Staff'].includes(userRole)

  // ── subject selection ──
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

  // ── list view ──
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── detail view ──
  const [open, setOpen] = useState<Discussion | null>(null)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)
  const repliesEndRef = useRef<HTMLDivElement>(null)

  // ── new discussion ──
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newSubjectId, setNewSubjectId] = useState('')
  const [creating, setCreating] = useState(false)

  // ── filter ──
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [search, setSearch] = useState('')

  // Auto-select first subject when subjects list changes
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0])
      setNewSubjectId(subjects[0]._id)
    }
  }, [subjects])

  // Load discussions when subject changes
  useEffect(() => {
    if (selectedSubject) {
      setDiscussions([])   // clear stale list before loading new subject
      loadDiscussions(selectedSubject._id)
    }
  }, [selectedSubject])

  // Scroll replies to bottom when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open?.replies?.length])

  const loadDiscussions = async (subjectId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiService.makeRequest(`/discussions?subjectId=${subjectId}`)
      if (res.success) {
        setDiscussions(res.data || [])
      } else {
        setError(res.message || 'Failed to load discussions')
      }
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim() || !newSubjectId) return
    setCreating(true)
    try {
      const sub = subjects.find(s => s._id === newSubjectId)
      const res = await apiService.makeRequest('/discussions', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          subjectId: newSubjectId,
          subjectName: sub ? `${sub.name} (${sub.code})` : ''
        })
      })
      if (res.success) {
        setShowNew(false)
        setNewTitle('')
        setNewContent('')
        if (sub && (!selectedSubject || selectedSubject._id !== newSubjectId)) {
          // Switching subject — useEffect will reload the correct discussion list
          setSelectedSubject(sub)
        } else {
          // Same subject — safe to optimistically prepend
          setDiscussions(prev => [res.data, ...prev])
        }
      } else {
        alert(res.message || 'Failed to create discussion')
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create discussion')
    } finally {
      setCreating(false)
    }
  }

  const handleReply = async () => {
    if (!open || !replyText.trim()) return
    setPosting(true)
    try {
      const res = await apiService.makeRequest(`/discussions/${open._id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ text: replyText.trim() })
      })
      if (res.success) {
        setOpen(res.data)
        setDiscussions(prev => prev.map(d => d._id === res.data._id ? res.data : d))
        setReplyText('')
      }
    } catch (e: any) {
      alert(e.message || 'Failed to post reply')
    } finally {
      setPosting(false)
    }
  }

  const handleStatusChange = async (disc: Discussion, status: string) => {
    try {
      const res = await apiService.makeRequest(`/discussions/${disc._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      if (res.success) {
        setDiscussions(prev => prev.map(d => d._id === res.data._id ? res.data : d))
        if (open?._id === res.data._id) setOpen(res.data)
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update discussion status')
    }
  }

  const handleTogglePin = async (disc: Discussion) => {
    try {
      const res = await apiService.makeRequest(`/discussions/${disc._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPinned: !disc.isPinned })
      })
      if (res.success) {
        setDiscussions(prev => prev.map(d => d._id === res.data._id ? res.data : d))
        if (open?._id === res.data._id) setOpen(res.data)
      }
    } catch (e: any) {
      alert(e.message || 'Failed to toggle pin')
    }
  }

  const handleDelete = async (disc: Discussion) => {
    if (!confirm('Delete this discussion? This cannot be undone.')) return
    try {
      const res = await apiService.makeRequest(`/discussions/${disc._id}`, { method: 'DELETE' })
      if (res.success) {
        setDiscussions(prev => prev.filter(d => d._id !== disc._id))
        if (open?._id === disc._id) setOpen(null)
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete discussion')
    }
  }

  // Filtered list
  const visible = discussions.filter(d => {
    if (filter === 'open' && d.status !== 'open') return false
    if (filter === 'resolved' && d.status !== 'resolved') return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) &&
        !d.authorName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Render: Detail view ──
  if (open) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white px-5 py-4 flex items-start gap-3">
          <button onClick={() => setOpen(null)} className="mt-0.5 p-1 rounded-lg hover:bg-white/20">
            <FiChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {open.isPinned && <FiBookmark size={14} className="text-yellow-300 flex-shrink-0" />}
              <h3 className="font-bold text-lg leading-snug">{open.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[open.status]}`}>
                {open.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[open.authorRole] || 'bg-white/20 text-white'}`}>
                {open.authorRole}
              </span>
              <span>{open.authorName}</span>
              <FiClock size={12} />
              <span>{timeAgo(open.createdAt)}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{open.subjectName}</span>
            </div>
          </div>
          {/* Faculty actions */}
          {isFaculty && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleTogglePin(open)}
                title={open.isPinned ? 'Unpin' : 'Pin to top'}
                className={`p-1.5 rounded-lg transition-colors ${open.isPinned ? 'bg-yellow-400/30 hover:bg-yellow-400/50' : 'hover:bg-white/20'}`}
              >
                <FiBookmark size={16} />
              </button>
              {open.status === 'open' && (
                <button
                  onClick={() => handleStatusChange(open, 'resolved')}
                  title="Mark as resolved"
                  className="p-1.5 rounded-lg hover:bg-white/20"
                >
                  <FiCheck size={16} />
                </button>
              )}
              {open.status !== 'open' && (
                <button
                  onClick={() => handleStatusChange(open, 'open')}
                  title="Reopen"
                  className="p-1.5 rounded-lg hover:bg-white/20"
                >
                  <FiRefreshCw size={16} />
                </button>
              )}
              <button
                onClick={() => handleDelete(open)}
                title="Delete discussion"
                className="p-1.5 rounded-lg hover:bg-red-500/40"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Original question */}
        <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
          <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{open.content}</p>
        </div>

        {/* Replies */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {open.replies.length === 0 ? (
            <p className="text-gray-400 text-sm text-center pt-4">No replies yet. Be the first to respond!</p>
          ) : (
            open.replies.map((reply) => (
              <div key={reply._id} className={`rounded-xl p-3 border ${
                reply.authorRole === 'Faculty' || reply.authorRole === 'Admin'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    reply.authorRole === 'Faculty' ? 'bg-indigo-700 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {(reply.authorName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-gray-800">{reply.authorName}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleColor[reply.authorRole] || 'bg-gray-100 text-gray-600'}`}>
                    {reply.authorRole}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap pl-9">{reply.text}</p>
              </div>
            ))
          )}
          <div ref={repliesEndRef} />
        </div>

        {/* Reply box — always visible, disabled if closed */}
        <div className="px-5 py-3 border-t border-gray-200 bg-white">
          {open.status === 'closed' ? (
            <p className="text-center text-sm text-gray-400 py-2">This discussion is closed.</p>
          ) : (
            <div className="flex gap-2 items-end">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply() }}
                placeholder="Write a reply… (Ctrl+Enter to send)"
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <button
                onClick={handleReply}
                disabled={posting || !replyText.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
              >
                <FiSend size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render: List view ──
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiMessageCircle size={22} />
            <h2 className="text-xl font-bold">Discussions</h2>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 shadow"
          >
            <FiPlus size={16} /> New
          </button>
        </div>

        {/* Subject tabs */}
        {subjects.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {subjects.map(s => (
              <button
                key={s._id}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSubject?._id === s._id
                    ? 'bg-white text-blue-700'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {s.code} — {s.name}
              </button>
            ))}
          </div>
        )}
        {subjects.length === 1 && selectedSubject && (
          <p className="text-sm text-blue-200">{selectedSubject.name} ({selectedSubject.code})</p>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search discussions…"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {(['all', 'open', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={() => selectedSubject && loadDiscussions(selectedSubject._id)}
          className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-200 transition-colors"
          title="Refresh"
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {!selectedSubject ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-8">
            <FiMessageCircle size={40} />
            <p className="text-center">Select a subject to view discussions.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-40 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="text-gray-500">Loading…</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={() => loadDiscussions(selectedSubject._id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2 p-8">
            <FiMessageCircle size={32} />
            <p className="text-center text-sm">No discussions yet for this subject.<br />Start one to get help from your faculty!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map(d => (
              <li
                key={d._id}
                onClick={() => setOpen(d)}
                className="px-5 py-4 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                    d.authorRole === 'Faculty' ? 'bg-indigo-700 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {(d.authorName || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      {d.isPinned && <FiBookmark size={12} className="text-yellow-500 flex-shrink-0" />}
                      <h4 className="font-semibold text-gray-900 text-sm leading-snug truncate">{d.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1.5">{d.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleColor[d.authorRole] || 'bg-gray-100 text-gray-600'}`}>
                        {d.authorRole}
                      </span>
                      <span className="text-xs text-gray-500">{d.authorName}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusBadge[d.status]}`}>{d.status}</span>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <FiMessageCircle size={11} /> {d.replies.length}
                        &nbsp;·&nbsp;
                        <FiClock size={11} /> {timeAgo(d.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── New Discussion Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-lg font-bold">Start a New Discussion</h3>
              <button onClick={() => setShowNew(false)} className="p-1 rounded-lg hover:bg-white/20">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Subject selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={newSubjectId}
                  onChange={e => setNewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What is your question or topic?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Provide more details about your question…"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => { setShowNew(false); setNewTitle(''); setNewContent('') }}
                  className="px-5 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDiscussion}
                  disabled={creating || !newTitle.trim() || !newContent.trim() || !newSubjectId}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
                >
                  {creating ? 'Posting…' : 'Post Discussion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
