import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export default function StudyPlan() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDate, setNewChapterDate] = useState('');
  const [newChapterTime, setNewChapterTime] = useState('');
  const [newChapterNotes, setNewChapterNotes] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#E6A817');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileName, setFileName] = useState('');
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [deletingChapter, setDeletingChapter] = useState(null);

  const active = subjects.find(s => s.id === activeSubject);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await api.get('/api/subjects');
        const mapped = data.map(s => ({
          id: s._id,
          name: s.name,
          color: s.color,
          progress: s.progress,
          chapters: []
        }));
        setSubjects(mapped);
        if (mapped.length > 0) setActiveSubject(mapped[0].id);
      } catch (err) {
        console.error('Failed to load study plan subjects:', err);
        showToast('Failed to load subjects', 'error');
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch chapters when activeSubject changes
  useEffect(() => {
    if (!activeSubject) return;
    const fetchChapters = async () => {
      try {
        const data = await api.get(`/api/subjects/${activeSubject}`);
        setSubjects(prev => prev.map(s => {
          if (s.id === activeSubject) {
            return {
              ...s,
              progress: data.progress,
              chapters: (data.chapters || []).map(c => ({
                id: c._id,
                title: c.title,
                done: c.done,
                notes: c.notes || '',
                date: c.date || '',
                time: c.time || ''
              }))
            };
          }
          return s;
        }));
      } catch (err) {
        console.error('Failed to load subject chapters:', err);
      }
    };
    fetchChapters();
  }, [activeSubject]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    try {
      const created = await api.post('/api/subjects', { name: newSubjectName.trim(), color: newSubjectColor });
      const mapped = { id: created._id, name: created.name, color: created.color, progress: 0, chapters: [] };
      setSubjects(prev => [...prev, mapped]);
      setNewSubjectName('');
      setActiveSubject(mapped.id);
      showToast(`Subject "${created.name}" added!`);
    } catch (err) {
      console.error('Failed to create subject:', err);
      showToast(err.message || 'Failed to add subject', 'error');
    }
  };

  const handleDeleteSubject = async (subId, subName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete subject "${subName}" and all its chapters?`)) return;
    setDeletingSubject(subId);
    try {
      await api.delete(`/api/subjects/${subId}`);
      const remaining = subjects.filter(s => s.id !== subId);
      setSubjects(remaining);
      if (activeSubject === subId) setActiveSubject(remaining[0]?.id ?? null);
      showToast(`Subject "${subName}" deleted`);
    } catch (err) {
      console.error('Failed to delete subject:', err);
      showToast(err.message || 'Failed to delete subject', 'error');
    } finally {
      setDeletingSubject(null);
    }
  };

  const toggleChapter = async (chapId) => {
    const subjectObj = subjects.find(s => s.id === activeSubject);
    if (!subjectObj) return;
    try {
      const updated = await api.patch(`/api/topics/${chapId}/toggle`);
      setSubjects(prev => prev.map(s => {
        if (s.id === activeSubject) {
          const updatedChapters = s.chapters.map(c => c.id === chapId ? { ...c, done: updated.done } : c);
          const doneCount = updatedChapters.filter(c => c.done).length;
          const newProgress = updatedChapters.length > 0 ? Math.round((doneCount / updatedChapters.length) * 100) : 0;
          return { ...s, chapters: updatedChapters, progress: newProgress };
        }
        return s;
      }));
    } catch (err) {
      console.error('Failed to toggle chapter:', err);
      showToast('Failed to update chapter', 'error');
    }
  };

  const handleDeleteChapter = async (chapId, chapTitle, e) => {
    e.stopPropagation();
    setDeletingChapter(chapId);
    try {
      await api.delete(`/api/topics/${chapId}`);
      setSubjects(prev => prev.map(s => {
        if (s.id === activeSubject) {
          const updatedChapters = s.chapters.filter(c => c.id !== chapId);
          const doneCount = updatedChapters.filter(c => c.done).length;
          const newProgress = updatedChapters.length > 0 ? Math.round((doneCount / updatedChapters.length) * 100) : 0;
          return { ...s, chapters: updatedChapters, progress: newProgress };
        }
        return s;
      }));
      showToast(`Chapter "${chapTitle}" removed`);
    } catch (err) {
      console.error('Failed to delete chapter:', err);
      showToast(err.message || 'Failed to delete chapter', 'error');
    } finally {
      setDeletingChapter(null);
    }
  };

  const addChapter = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !activeSubject) return;
    setAddingChapter(true);
    try {
      const created = await api.post('/api/topics', {
        subject: activeSubject,
        title: newChapterTitle.trim(),
        notes: newChapterNotes,
        date: newChapterDate,
        time: newChapterTime,
        estimatedHours: 1
      });
      setSubjects(prev => prev.map(s => {
        if (s.id === activeSubject) {
          const newChapter = { id: created._id, title: created.title, done: created.done, notes: created.notes || '', date: created.date || '', time: created.time || '' };
          const updatedChapters = [...s.chapters, newChapter];
          const doneCount = updatedChapters.filter(c => c.done).length;
          const newProgress = Math.round((doneCount / updatedChapters.length) * 100);
          return { ...s, chapters: updatedChapters, progress: newProgress };
        }
        return s;
      }));
      setNewChapterTitle('');
      setNewChapterNotes('');
      setNewChapterDate('');
      setNewChapterTime('');
      showToast(`Branch "${created.title}" planted! 🌱`);
    } catch (err) {
      console.error('Failed to save chapter:', err);
      showToast(err.message || 'Failed to add chapter', 'error');
    } finally {
      setAddingChapter(false);
    }
  };

  const handleSyllabusUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setUploadStatus('Reading your syllabus... 📖');
    setTimeout(() => {
      setUploadStatus('Preparing your study branches... 🕰️');
      setTimeout(() => {
        setUploadStatus('Ready! Add your own branches below. 🌲');
        setTimeout(() => { setUploading(false); setUploadStatus(''); setFileName(''); }, 1200);
      }, 1200);
    }, 1200);
  };

  if (loadingSubjects) {
    return (
      <div className="study-plan-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 40, display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🗺️</span>
          <p className="handwritten" style={{ fontSize: 20, marginTop: 8 }}>Loading study branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="study-plan-panel">
      {/* Toast */}
      {toast && (
        <div className="sp-toast sketch-border-sm" style={{ background: toast.type === 'error' ? '#FFEDEB' : '#E8F5E9', border: `2px solid ${toast.type === 'error' ? '#C62828' : '#2E7D32'}`, color: toast.type === 'error' ? '#C62828' : '#1B5E20' }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div className="panel-header">
        <h2 className="panel-title">🗺️ Study Plan Branches</h2>
        <p className="panel-subtitle">Add your own subjects and chapters to begin planning.</p>
      </div>

      {/* Syllabus Upload Block */}
      <div className="syllabus-upload-card sketch-border sketch-shadow">
        <div className="upload-header">
          <span className="upload-icon">📂</span>
          <div className="upload-text-block">
            <h3 className="font-bold text-base">Autopilot Syllabus Planner</h3>
            <p className="text-xs text-gray-500">Upload your own syllabus PDF/Image to prepare study branches.</p>
          </div>
        </div>
        {uploading ? (
          <div className="upload-loading-area text-center py-4">
            <div className="spinner-sketch">🔄</div>
            <p className="handwritten text-lg mt-2 color-primary">{uploadStatus}</p>
            <span className="text-xxs text-gray-500">File: {fileName}</span>
          </div>
        ) : (
          <div className="upload-drag-area sketch-border-sm">
            <label className="upload-label-btn cursor-pointer">
              <span>📄 Click to Upload Syllabus / Notes</span>
              <input type="file" onChange={handleSyllabusUpload} accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden-file-input" />
            </label>
            <span className="text-xxs text-gray-500 mt-1">Accepts PDF, JPG, PNG, TXT (Max 5MB)</span>
          </div>
        )}
      </div>

      <div className="sp-layout">
        {/* Subject Sidebar */}
        <div className="sp-subject-sidebar">
          {subjects.length === 0 ? (
            <div className="sp-empty sketch-border-sm">No subjects yet. Add one below!</div>
          ) : subjects.map(s => (
            <div key={s.id} className={`sp-subject-tab sketch-border-sm ${activeSubject === s.id ? 'active-tab' : ''}`}
              style={{ '--tab-color': s.color }} onClick={() => setActiveSubject(s.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="subject-name">{s.name}</span>
                <button
                  onClick={(e) => handleDeleteSubject(s.id, s.name, e)}
                  disabled={deletingSubject === s.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#C62828', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                  title={`Delete ${s.name}`}
                >
                  {deletingSubject === s.id ? '...' : '✕'}
                </button>
              </div>
              <div className="subject-mini-progress">
                <div className="subject-mini-fill" style={{ width: `${s.progress}%`, background: s.color }}></div>
              </div>
              <span className="subject-pct">{s.progress}% complete</span>
            </div>
          ))}

          {/* Add Subject form */}
          <form onSubmit={handleAddSubject} className="add-subject-form sketch-border-sm">
            <h4 className="font-bold text-xs" style={{ borderBottom: '1.5px dashed var(--wood-ink)', paddingBottom: '4px', marginBottom: '6px' }}>🌿 Add New Subject</h4>
            <input
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              placeholder="e.g. Physics"
              className="form-input sketch-border-sm"
              style={{ fontSize: '13px', minHeight: '34px', padding: '4px 8px' }}
              required
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--wood-ink-muted)' }}>Color:</label>
              <input
                type="color"
                value={newSubjectColor}
                onChange={e => setNewSubjectColor(e.target.value)}
                style={{ border: 'none', background: 'none', width: '32px', height: '32px', padding: 0, cursor: 'pointer' }}
              />
              <button type="submit" className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow" style={{ flex: 1, padding: '4px 8px', fontSize: '12px', minHeight: '32px' }}>
                + Add
              </button>
            </div>
          </form>
        </div>

        {/* Chapter List */}
        <div className="sp-chapter-col sketch-border sketch-shadow">
          <div className="sp-chapter-header" style={{ borderBottom: `3px solid ${active?.color || 'var(--wood-accent)'}` }}>
            <h3 className="font-bold text-xl">{active?.name ? `${active.name} — Study Branches` : 'Select a Subject'}</h3>
            <div className="sp-overall-bar sketch-border-sm">
              <div className="sp-overall-fill" style={{ width: `${active?.progress || 0}%`, background: active?.color || 'var(--wood-accent)' }}></div>
            </div>
            <p className="text-xs text-gray-500">
              {active
                ? `${active.progress}% complete · ${active.chapters.filter(c => c.done).length}/${active.chapters.length} chapters done`
                : 'No subject selected.'}
            </p>
          </div>

          <ul className="chapter-list">
            {active?.chapters?.length ? active.chapters.map((ch) => (
              <li key={ch.id} className={`chapter-item sketch-border-sm ${ch.done ? 'chapter-done' : ''}`}>
                <div onClick={() => toggleChapter(ch.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, cursor: 'pointer' }}>
                  <div className="chapter-check sketch-border-sm">
                    {ch.done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#2D2C24" strokeWidth="2.5" strokeLinecap="round" /></svg>}
                  </div>
                  <div className="chapter-body">
                    <div className="chapter-title-row">
                      <p className="chapter-title">{ch.title}</p>
                      <div className="chapter-meta">
                        {ch.date && <span className="meta-badge date-badge">📅 {ch.date}</span>}
                        {ch.time && <span className="meta-badge time-badge">⏰ {ch.time}</span>}
                      </div>
                    </div>
                    {ch.notes && <p className="chapter-note handwritten">✏️ {ch.notes}</p>}
                  </div>
                  <span className="chapter-status">{ch.done ? '✅' : '○'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteChapter(ch.id, ch.title, e)}
                  disabled={deletingChapter === ch.id}
                  style={{ background: 'none', border: '1.5px solid #C62828', cursor: 'pointer', color: '#C62828', padding: '2px 7px', borderRadius: 3, fontSize: 12, flexShrink: 0, alignSelf: 'center' }}
                  title="Remove chapter"
                >
                  {deletingChapter === ch.id ? '...' : '🗑'}
                </button>
              </li>
            )) : (
              <li className="chapter-empty sketch-border-sm">
                {active ? 'No branches yet. Add one below! 🌱' : 'Select a subject from the sidebar.'}
              </li>
            )}
          </ul>

          {/* Add Chapter Form */}
          {active && (
            <form onSubmit={addChapter} className="add-chapter-form-expanded sketch-border-sm">
              <h4 className="font-bold text-sm mb-3">🌿 Carve a New Study Branch</h4>
              <div className="manual-form-grid">
                <div className="form-group-sm">
                  <label className="text-xxs font-bold">Branch Title *</label>
                  <input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
                    placeholder="Enter a branch title" className="form-input sketch-border-sm" required />
                </div>
                <div className="form-group-sm">
                  <label className="text-xxs font-bold">Target Date</label>
                  <input type="date" value={newChapterDate} onChange={e => setNewChapterDate(e.target.value)} className="form-input sketch-border-sm" />
                </div>
                <div className="form-group-sm">
                  <label className="text-xxs font-bold">Study Time Slot</label>
                  <input value={newChapterTime} onChange={e => setNewChapterTime(e.target.value)}
                    placeholder="e.g. 10:00 AM" className="form-input sketch-border-sm" />
                </div>
                <div className="form-group-sm full-width">
                  <label className="text-xxs font-bold">Quick Memo</label>
                  <input value={newChapterNotes} onChange={e => setNewChapterNotes(e.target.value)}
                    placeholder="Add a short note or reminder" className="form-input sketch-border-sm" />
                </div>
              </div>
              <button type="submit" disabled={addingChapter} className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow mt-3 w-full justify-center study-plan-submit-btn">
                {addingChapter ? '🌱 Planting...' : '+ Plant Study Branch'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .study-plan-panel { display: flex; flex-direction: column; gap: 24px; }
        .sp-toast { padding: 12px 18px; font-size: 14px; font-weight: bold; font-family: var(--heading); animation: fadeInDown 0.3s ease; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .syllabus-upload-card { background: var(--wood-card); padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .upload-header { display: flex; gap: 14px; align-items: center; }
        .upload-icon { font-size: 32px; }
        .upload-drag-area { background: var(--wood-bg); border: 2.5px dashed var(--wood-ink); padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s; }
        .upload-drag-area:hover { background: #FFFDF0; }
        .upload-label-btn { font-family: var(--heading); font-weight: 700; color: var(--wood-primary-hover); font-size: 15px; cursor: pointer; }
        .hidden-file-input { display: none; }
        .upload-loading-area { background: var(--wood-bg); padding: 20px; border: 2px solid var(--wood-ink); border-radius: 6px; }
        .spinner-sketch { font-size: 32px; animation: spin 1.5s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .sp-layout { display: grid; grid-template-columns: 230px 1fr; gap: 22px; }
        @media (max-width: 768px) { .sp-layout { grid-template-columns: 1fr; } }
        .sp-subject-sidebar { display: flex; flex-direction: column; gap: 10px; }
        .sp-subject-tab { background: var(--wood-card); border: 2px solid var(--wood-ink); padding: 12px 14px; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s; }
        .sp-subject-tab:hover { transform: translateX(3px); }
        .sp-subject-tab.active-tab { background: var(--tab-color, var(--wood-accent)); box-shadow: 3px 3px 0 var(--wood-ink); }
        .sp-empty, .chapter-empty { background: var(--wood-card); padding: 14px; color: var(--wood-ink-muted); font-size: 13px; }
        .subject-name { font-family: var(--heading); font-weight: 700; font-size: 15px; }
        .subject-mini-progress { height: 6px; background: rgba(45,44,36,0.1); border: 1px solid var(--wood-ink); border-radius: 3px; overflow: hidden; }
        .subject-mini-fill { height: 100%; transition: width 0.4s; }
        .subject-pct { font-size: 11px; font-family: var(--heading); color: var(--wood-ink-muted); }

        .add-subject-form { background: var(--wood-card); padding: 12px; display: flex; flex-direction: column; gap: 8px; margin-top: 5px; }

        .sp-chapter-col { background: var(--wood-card); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .sp-chapter-header { padding-bottom: 14px; display: flex; flex-direction: column; gap: 6px; }
        .sp-overall-bar { height: 12px; background: var(--wood-bg); overflow: hidden; }
        .sp-overall-fill { height: 100%; transition: width 0.4s; }
        .chapter-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .chapter-item { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: var(--wood-bg); transition: all 0.2s; border: 1.5px solid var(--wood-border-light); }
        .chapter-item:hover { background: #FFFDF0; transform: translateX(2px); }
        .chapter-item.chapter-done { opacity: 0.7; background: var(--wood-sage); }
        .chapter-check { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--wood-card); flex-shrink: 0; margin-top: 2px; border: 1.5px solid var(--wood-ink); }
        .chapter-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .chapter-title-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .chapter-title { font-family: var(--heading); font-size: 15px; font-weight: 700; color: var(--wood-ink); }
        .chapter-item.chapter-done .chapter-title { text-decoration: line-through; }
        .chapter-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .meta-badge { font-size: 11px; font-weight: bold; background: var(--wood-card); border: 1.5px solid var(--wood-ink); padding: 1px 6px; border-radius: 4px; }
        .chapter-note { font-size: 15px; color: var(--wood-ink-muted); margin-top: 1px; }
        .chapter-status { font-size: 16px; align-self: center; }
        
        .add-chapter-form-expanded { background: var(--wood-bg); padding: 18px; border: 2.5px solid var(--wood-ink); display: flex; flex-direction: column; }
        .manual-form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 600px) { .manual-form-grid { grid-template-columns: 1fr; } }
        .form-group-sm { display: flex; flex-direction: column; gap: 4px; }
        .full-width { grid-column: span 3; }
        @media (max-width: 600px) { .full-width { grid-column: span 1; } }
        .add-chapter-form-expanded .form-input { background: var(--wood-card); min-height: 40px; padding: 8px 12px; font-size: 14px; border: 2px solid var(--wood-ink); color: var(--wood-ink); width: 100%; box-sizing: border-box; }
        .add-chapter-form-expanded .form-input:focus { background: #FFFDF0; border-color: var(--wood-primary) !important; outline: none; }
        .study-plan-submit-btn { min-height: 46px; }
        .study-plan-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .color-primary { color: var(--wood-primary-hover); }
        .text-xxs { font-size: 11px; }
      `}</style>
    </div>
  );
}
