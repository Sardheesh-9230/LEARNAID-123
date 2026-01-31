const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Material = require('../models/Material');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const File = require('../models/File');
const path = require('path');
const fs = require('fs/promises');
const pdfParse = require('pdf-parse');

const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const resolveExistingPath = async (maybePath) => {
  if (!maybePath || typeof maybePath !== 'string') return null;

  const normalized = maybePath.replace(/\\/g, '/');
  const basename = path.basename(normalized);

  const candidates = [
    normalized,
    path.resolve(normalized),
    path.join(process.cwd(), normalized),
    path.join(process.cwd(), 'uploads', 'materials', basename),
    path.join(process.cwd(), 'uploads', 'pdfs', basename),
    path.join(process.cwd(), 'uploads', basename),
    path.join(process.cwd(), 'backend', 'uploads', 'materials', basename),
    path.join(process.cwd(), 'backend', 'uploads', 'pdfs', basename)
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch (_) {
      // keep trying
    }
  }

  return null;
};

const chunkText = (text, chunkSize = 1200, overlap = 200) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(clean.length, start + chunkSize);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
};

const pickRelevantChunks = (chunks, question, topK = 4) => {
  const keywords = (question || '')
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3);

  if (!keywords.length) return chunks.slice(0, topK);

  const scored = chunks
    .map((chunk) => {
      const hay = chunk.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (hay.includes(kw)) score += 1;
      }
      return { chunk, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(x => x.chunk);
};

/**
 * @route   POST /api/chatbot/query
 * @desc    Process student query using RAG (Retrieval-Augmented Generation)
 * @access  Private (Student)
 */
router.post('/query', protect, authorize('Student'), async (req, res) => {
  try {
    const { question, subjectId, chapterId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Materials use Draft/Published/Archived; treat non-archived as available
    const query = {
      status: { $ne: 'Archived' }
    };

    // Filter by subject if provided
    if (subjectId) {
      query.subject = subjectId;
    }

    // Filter by chapter if provided
    if (chapterId) {
      query.chapter = chapterId;
    }

    // Fetch relevant materials
    const materials = await Material.find(query)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    // Simple keyword-based retrieval (replace with vector search for production)
    const relevantMaterials = materials.filter(material => {
      const searchText = `${material.title} ${material.description} ${material.chapter?.title} ${material.subject?.name}`.toLowerCase();
      const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => searchText.includes(keyword));
    });

    // Generate response based on materials
    let response;
    if (relevantMaterials.length > 0) {
      const materialInfo = relevantMaterials.map(m => ({
        title: m.title,
        type: m.type,
        description: m.description,
        subject: m.subject?.name,
        chapter: m.chapter?.title,
        url: m.url || `/materials/${m._id}`
      }));

      response = {
        answer: `I found ${relevantMaterials.length} relevant material(s) that might help answer your question. Here's what I found:`,
        materials: materialInfo,
        hasResults: true
      };
    } else {
      response = {
        answer: "I couldn't find specific materials related to your question. Could you try rephrasing or asking about a specific subject or chapter?",
        materials: [],
        hasResults: false,
        suggestions: [
          "Try asking about a specific subject or chapter",
          "Check your available courses and materials",
          "Contact your teacher for additional resources"
        ]
      };
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your question',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/materials
 * @desc    Get all available materials for student
 * @access  Private (Student)
 */
router.get('/materials', protect, authorize('Student'), async (req, res) => {
  try {
    const { subjectId, type } = req.query;

    const query = { status: { $ne: 'Archived' } };

    if (subjectId) {
      query.subject = subjectId;
    }

    if (type) {
      query.type = type;
    }

    const materials = await Material.find(query)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code')
      .sort({ 'chapter.chapterNumber': 1, order: 1, createdAt: 1 });

    res.json({
      success: true,
      count: materials.length,
      data: materials
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching materials',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/subjects
 * @desc    Get all subjects available to student
 * @access  Private (Student)
 */
router.get('/subjects', protect, authorize('Student'), async (req, res) => {
  try {
    const subjects = await Subject.find({ status: 'Active' })
      .populate('department', 'name code')
      .select('name code description department');

    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/chapters/:subjectId
 * @desc    Get chapters for a specific subject
 * @access  Private (Student)
 */
router.get('/chapters/:subjectId', protect, authorize('Student'), async (req, res) => {
  try {
    const { subjectId } = req.params;

    const chapters = await Chapter.find({ 
      subject: subjectId,
      status: { $ne: 'Archived' }
    })
    .populate('subject', 'name code')
    .sort({ chapterNumber: 1, displayOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      count: chapters.length,
      data: chapters
    });

  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chatbot/material-chat
 * @desc    Answer using selected material (lightweight RAG: extract + retrieve excerpts)
 * @access  Private (Student)
 */
router.post('/material-chat', protect, authorize('Student'), async (req, res) => {
  try {
    const { question, materialId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }
    if (!materialId) {
      return res.status(400).json({ success: false, message: 'materialId is required' });
    }

    const material = await Material.findById(materialId)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code');

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    if (material.type !== 'PDF') {
      return res.json({
        success: true,
        data: {
          answer: `The selected material is "${material.type}". Currently, Material RAG is supported for PDF files. Please select a PDF material or switch to Web (Tavily).`,
          materials: [
            {
              title: material.title,
              type: material.type,
              description: material.description,
              subject: material.subject?.name,
              chapter: material.chapter?.title
            }
          ],
          suggestions: ['Switch to Web (Tavily)', 'Select a PDF material file']
        }
      });
    }

    let filePath = material.fileMetadata?.filePath;

    if (!filePath && material.file) {
      const f = await File.findById(material.file).select('path');
      filePath = f?.path;
    }

    const resolved = await resolveExistingPath(filePath);
    if (!resolved) {
      return res.json({
        success: true,
        data: {
          answer: 'I can’t access the PDF file on the server for this material (missing file path or file not found). Please contact your faculty/admin to re-upload it.',
          materials: [
            {
              title: material.title,
              type: material.type,
              description: material.description,
              subject: material.subject?.name,
              chapter: material.chapter?.title
            }
          ],
          suggestions: ['Try another material file', 'Switch to Web (Tavily)']
        }
      });
    }

    const buf = await fs.readFile(resolved);
    const parsed = await pdfParse(buf);
    const text = parsed?.text || '';
    const chunks = chunkText(text);
    const relevant = pickRelevantChunks(chunks, question, 4);

    if (!relevant.length) {
      return res.json({
        success: true,
        data: {
          answer: 'I scanned the selected PDF but couldn’t find a clearly matching section for your question. Try rephrasing with more specific keywords.',
          materials: [
            {
              title: material.title,
              type: material.type,
              description: material.description,
              subject: material.subject?.name,
              chapter: material.chapter?.title
            }
          ],
          suggestions: ['Ask with more specific keywords', 'Try a different unit/material']
        }
      });
    }

    const excerpts = relevant
      .map((c, i) => `${i + 1}) ${c.trim()}`)
      .join('\n\n');

    res.json({
      success: true,
      data: {
        answer: `Based on the selected material, here are the most relevant excerpts:\n\n${excerpts}`,
        materials: [
          {
            title: material.title,
            type: material.type,
            description: material.description,
            subject: material.subject?.name,
            chapter: material.chapter?.title
          }
        ],
        sources: [
          {
            title: material.title,
            url: `/api/materials/${material._id}/view`
          }
        ]
      }
    });
  } catch (error) {
    console.error('Material chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing material chat',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chatbot/web-search
 * @desc    Web search via Tavily (API key from env)
 * @access  Private (Student)
 */
router.post('/web-search', protect, authorize('Student'), async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const tavilyKey = process.env.TAVILY_API_KEY || process.env.TAVILY_KEY || process.env.TAVILY_APIKEY;
    if (!tavilyKey) {
      return res.status(400).json({
        success: false,
        message: 'Tavily API key not configured. Set TAVILY_API_KEY in backend/.env and restart the backend server.'
      });
    }

    const resp = await fetchFn('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: question,
        max_results: 5,
        include_answer: true,
        include_raw_content: false
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return res.status(502).json({
        success: false,
        message: 'Tavily request failed',
        error: errText
      });
    }

    const payload = await resp.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const sources = results.slice(0, 5).map(r => ({
      title: r.title || r.url || 'Result',
      url: r.url
    }));

    res.json({
      success: true,
      data: {
        answer: payload?.answer || 'Here are relevant web results for your query.',
        sources
      }
    });
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing web search',
      error: error.message
    });
  }
});

module.exports = router;
