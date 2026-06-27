import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import '../../styles/student/revision.css';

const tags = ['all', 'must-revise', 'tricky', 'formula'];
const colors = { yellow: 'var(--note-yellow)', pink: 'var(--note-pink)', green: 'var(--note-green)' };
const tagColors = { 'must-revise': '#FFE082', tricky: '#FFAB91', formula: '#A5D6A7' };

export default function Revision() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('deck'); // 'deck' or 'subject-wise'
  
  // Attached resource state
  const [selectedFileMock, setSelectedFileMock] = useState('');

  const [form, setForm] = useState({ 
    subject: '', 
    keyword: '', 
    detail: '', 
    tag: 'must-revise', 
    color: 'yellow', 
    date: '', 
    time: '',
    resource: 'None'
  });
  
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [activeResourcePreview, setActiveResourcePreview] = useState(null); // resource file preview name

  // Fetch all revision notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.get('/api/revision');
        setNotes(data.map(n => ({
          id: n._id,
          subject: n.subject,
          keyword: n.keyword,
          detail: n.detail,
          tag: n.tag,
          color: n.color || 'yellow',
          date: n.date || '',
          time: n.time || '',
          resource: n.resource || 'None'
        })));
      } catch (err) {
        console.error('Failed to load revision notes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const filtered = activeTag === 'all' ? notes : notes.filter(n => n.tag === activeTag);

  const toggleFlip = (id) => setFlipped(f => ({ ...f, [id]: !f[id] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.keyword || !form.detail || !form.subject) return;
    
    try {
      const body = {
        ...form,
        resource: selectedFileMock || form.resource || 'None'
      };

      if (editingNoteId) {
        // Edit flow
        const updated = await api.put(`/api/revision/${editingNoteId}`, body);
        setNotes(prev => prev.map(n => n.id === editingNoteId ? {
          id: updated._id,
          subject: updated.subject,
          keyword: updated.keyword,
          detail: updated.detail,
          tag: updated.tag,
          color: updated.color || 'yellow',
          date: updated.date || '',
          time: updated.time || '',
          resource: updated.resource || 'None'
        } : n));
        setEditingNoteId(null);
      } else {
        // Create flow
        const created = await api.post('/api/revision', body);
        setNotes(prev => [...prev, {
          id: created._id,
          subject: created.subject,
          keyword: created.keyword,
          detail: created.detail,
          tag: created.tag,
          color: created.color || 'yellow',
          date: created.date || '',
          time: created.time || '',
          resource: created.resource || 'None'
        }]);
      }

      setForm({ subject: '', keyword: '', detail: '', tag: 'must-revise', color: 'yellow', date: '', time: '', resource: 'None' });
      setSelectedFileMock('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save revision note:', err);
    }
  };

  const handleStartEdit = (note, e) => {
    if (e) e.stopPropagation();
    setForm({
      subject: note.subject,
      keyword: note.keyword,
      detail: note.detail,
      tag: note.tag,
      color: note.color,
      date: note.date,
      time: note.time,
      resource: note.resource
    });
    setEditingNoteId(note.id);
    setSelectedFileMock(note.resource !== 'None' ? note.resource : '');
    setShowForm(true);
    // Scroll to form or top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteNote = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this revision card?')) return;
    try {
      await api.delete(`/api/revision/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setForm({ subject: '', keyword: '', detail: '', tag: 'must-revise', color: 'yellow', date: '', time: '', resource: 'None' });
      }
    } catch (err) {
      console.error('Failed to delete revision card:', err);
    }
  };

  const groupSubjectWise = () => {
    const grouped = {};
    filtered.forEach(note => {
      const sub = note.subject || 'General';
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(note);
    });
    return grouped;
  };

  const handleResourceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileMock(file.name);
    }
  };

  const groupedNotes = groupSubjectWise();

  if (loading) {
    return (
      <div className="revision-panel text-center py-12">
        <span className="spinner-sketch text-4xl">🔄</span>
        <p className="handwritten text-lg mt-2">Opening flashcard cabinet drawer...</p>
      </div>
    );
  }

  return (
    <div className="revision-panel">
      <div className="panel-header">
        <h2 className="panel-title">🔁 Revision Desk</h2>
        <p className="panel-subtitle">Create and practice flashcards to retain core takeaways.</p>
      </div>

      {/* Mode Switches */}
      <div className="mode-switch-row">
        <button onClick={() => setViewMode('deck')} className={`mode-btn sketch-border-sm ${viewMode === 'deck' ? 'mode-active' : ''}`}>
          🎴 Flashcard Deck
        </button>
        <button onClick={() => setViewMode('subject-wise')} className={`mode-btn sketch-border-sm ${viewMode === 'subject-wise' ? 'mode-active' : ''}`}>
          📅 Subject-Wise Planner
        </button>
      </div>

      {/* Tag Filter & Add Form Toggle */}
      <div className="tag-filter-row">
        {tags.map(t => (
          <button key={t} onClick={() => setActiveTag(t)}
            className={`tag-filter-btn sketch-border-sm ${activeTag === t ? 'tag-active' : ''}`}>
            {t === 'all' ? '📚 All' : t === 'must-revise' ? '⭐ Must Revise' : t === 'tricky' ? '🌀 Tricky' : '📐 Formula'}
          </button>
        ))}
        <button onClick={() => {
          if (showForm) {
            setEditingNoteId(null);
            setForm({ subject: '', keyword: '', detail: '', tag: 'must-revise', color: 'yellow', date: '', time: '', resource: 'None' });
          }
          setShowForm(!showForm);
        }} className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow ml-auto">
          {showForm ? '✕ Cancel' : '+ New Revision Card'}
        </button>
      </div>

      {/* Resource Preview modal */}
      {activeResourcePreview && (
        <div className="resource-preview-modal sketch-border sketch-shadow">
          <div className="modal-header border-bottom pb-2">
            <h4 className="font-bold text-sm">📎 Preview: {activeResourcePreview}</h4>
            <button onClick={() => setActiveResourcePreview(null)} className="close-preview-btn">✕</button>
          </div>
          <div className="modal-body text-center py-6">
            <span className="folder-large-icon">📂</span>
            <p className="handwritten mt-2">Attach a resource to preview your notes.</p>
            <div className="mock-file-content sketch-border-sm mt-3">
              <p className="text-xxs font-bold text-gray-500 uppercase border-bottom pb-1">Milestone Highlights</p>
              <ul className="text-left text-xs list-disc pl-4 mt-2 leading-relaxed">
                <li>Associated file: {activeResourcePreview}</li>
                <li>Ready for active retrieval.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="add-note-form sketch-border sketch-shadow">
          <div className="add-note-tape"></div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject (e.g. History)" className="form-input sketch-border-sm" required />
            </div>
            <div className="form-group">
              <label className="form-label">Keyword / Topic *</label>
              <input value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} placeholder="e.g. French Revolution" className="form-input sketch-border-sm" required />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Revision Details / Core takeaways *</label>
            <textarea value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} placeholder="Write key equations, facts, or concepts here..." className="form-input sketch-border-sm" rows={3} required />
          </div>

          {/* Sibling File upload for Revision Planning */}
          <div className="form-group">
            <label className="form-label">📎 Associate Revision Resource (Syllabus/Notes/PDF)</label>
            <div className="mock-upload-row">
              <label className="upload-label-small sketch-border-sm">
                📁 Select syllabus sheet or PDF notes
                <input type="file" onChange={handleResourceUpload} accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden-file-input" />
              </label>
              {selectedFileMock && (
                <span className="selected-mock-filename font-bold text-xs color-primary">
                  📄 {selectedFileMock.substring(0, 20)}...
                </span>
              )}
            </div>
            <p className="text-xxs text-gray-500 mt-1">Linking a reference sheet lets you plan precisely when and how to revise the chapter details.</p>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Target Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input sketch-border-sm" required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Time *</label>
              <input value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="e.g. 4:00 PM" className="form-input sketch-border-sm" required />
            </div>
            <div className="form-group">
              <label className="form-label">Tag</label>
              <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} className="form-input sketch-border-sm">
                <option value="must-revise">⭐ Must Revise</option>
                <option value="tricky">🌀 Tricky</option>
                <option value="formula">📐 Formula</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn-sketch btn-sketch-primary sketch-border sketch-shadow mt-2">
            {editingNoteId ? '💾 Save Changes' : 'Carve This Revision Note'}
          </button>
        </form>
      )}

      {/* VIEW 1: Flashcard Deck view */}
      {viewMode === 'deck' && (
        <div className="flashcards-grid">
          {filtered.map(n => (
            <div key={n.id} className={`flashcard-wrap ${flipped[n.id] ? 'is-flipped' : ''}`} onClick={() => toggleFlip(n.id)}>
              <div className="flashcard-inner">
                {/* Front */}
                <div className="flashcard-face flashcard-front sketch-border sketch-shadow" style={{ background: colors[n.color] || 'var(--note-yellow)' }}>
                  <div className="card-tag-badge" style={{ background: tagColors[n.tag] }}>{n.tag}</div>
                  <div className="card-subject">{n.subject}</div>
                  <h3 className="card-keyword">{n.keyword}</h3>
                  <div className="card-schedule-tag">
                    {n.date && <span>📅 {n.date}</span>}
                    {n.time && <span>⏰ {n.time}</span>}
                  </div>
                  {n.resource && n.resource !== 'None' && (
                    <button onClick={(e) => { e.stopPropagation(); setActiveResourcePreview(n.resource); }} className="card-resource-clip-badge handwritten text-xxs">
                      📎 {n.resource.substring(0, 12)}...
                    </button>
                  )}
                  <p className="card-flip-hint handwritten">tap to reveal ↩</p>
                  
                  {/* Actions */}
                  <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6 }}>
                    <button className="sketch-border-sm" style={{ background: '#FFFDF9', cursor: 'pointer', fontSize: 11, padding: '2px 5px', borderRadius: 4 }} onClick={(e) => handleStartEdit(n, e)} title="Edit Note">✏️</button>
                    <button className="sketch-border-sm" style={{ background: '#FFEDEB', cursor: 'pointer', fontSize: 11, color: '#C62828', padding: '2px 5px', borderRadius: 4 }} onClick={(e) => deleteNote(n.id, e)} title="Delete Note">✕</button>
                  </div>
                </div>
                {/* Back */}
                <div className="flashcard-face flashcard-back sketch-border sketch-shadow" style={{ background: colors[n.color] || 'var(--note-yellow)' }}>
                  <div className="card-tag-badge" style={{ background: tagColors[n.tag] }}>{n.tag}</div>
                  <p className="card-detail">{n.detail}</p>
                  <div className="card-schedule-tag text-xs text-gray-500 font-mono mt-4">
                    <span>Target: {n.date} at {n.time}</span>
                  </div>
                  {n.resource && n.resource !== 'None' && (
                    <button onClick={(e) => { e.stopPropagation(); setActiveResourcePreview(n.resource); }} className="resource-preview-btn-back sketch-border-sm mt-2 justify-center">
                      📁 Open Attached Resource
                  </button>
                  )}
                  <p className="card-flip-hint handwritten">tap to flip back ↩</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: Subject-Wise Timeline View */}
      {viewMode === 'subject-wise' && (
        <div className="subject-wise-container">
          {Object.keys(groupedNotes).map(sub => (
            <div key={sub} className="subject-group-folder sketch-border sketch-shadow">
              <div className="subject-folder-tab sketch-border-sm">
                <span>📁 {sub}</span>
                <span className="folder-count">{groupedNotes[sub].length} topics</span>
              </div>
              <div className="subject-folder-sheet">
                <ul className="folder-note-list" style={{ padding: 0 }}>
                  {groupedNotes[sub].map(n => (
                    <li key={n.id} className="folder-note-item sketch-border-sm" style={{ borderLeft: `5px solid ${tagColors[n.tag]}` }}>
                      <div className="note-item-main">
                        <div className="note-title-row">
                          <h4 className="note-item-title font-bold text-base">{n.keyword}</h4>
                          {n.resource && n.resource !== 'None' && (
                            <button onClick={() => setActiveResourcePreview(n.resource)} className="badge-small bg-sky text-xxs font-bold cursor-pointer inline-flex items-center gap-1">
                              📎 {n.resource}
                            </button>
                          )}
                        </div>
                        <p className="note-item-desc text-xs text-gray-600 mt-1">{n.detail}</p>
                        
                        {/* Target revision schedule details in the list item! */}
                        <div className="note-item-schedule-row mt-3 text-xxs font-bold">
                          {n.date && <span className="sched-badge border-green">📅 Revision Target Date: {n.date}</span>}
                          {n.time && <span className="sched-badge border-sky ml-2">⏰ Revision Time: {n.time}</span>}
                        </div>
                      </div>
                      
                      <div className="note-item-status flex flex-col items-end gap-1">
                        <span className="badge-small text-xxs font-bold" style={{ background: tagColors[n.tag] }}>{n.tag}</span>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button style={{ background: '#FFFDF9', border: '1.5px solid var(--wood-ink)', cursor: 'pointer', padding: '3px 8px', borderRadius: 4, fontSize: 12 }} onClick={(e) => handleStartEdit(n, e)}>✏️ Edit</button>
                          <button className="note-item-delete-inline" style={{ color: '#C62828' }} onClick={(e) => deleteNote(n.id, e)}>✕ Delete</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {Object.keys(groupedNotes).length === 0 && (
            <div className="empty-state sketch-border-sm">
              <span style={{ fontSize: 40 }}>📭</span>
              <p className="handwritten" style={{ fontSize: 22 }}>No revision cards to group. Carve one!</p>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && viewMode === 'deck' && (
        <div className="empty-state sketch-border-sm">
          <span style={{ fontSize: 40 }}>📭</span>
          <p className="handwritten" style={{ fontSize: 22 }}>No cards yet for this tag. Carve one!</p>
        </div>
      )}
    </div>
  );
}
