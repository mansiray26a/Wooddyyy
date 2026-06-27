import React, { useState, useEffect } from 'react';
import { api } from '../../api';

const SWATCHES = ['#E6A817', '#7BA05B', '#C97B5A', '#5A8CA0', '#B05A8C', '#8C7BA0'];

const computeDaysLeft = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
};

const daysLabel = (d) => {
  if (d === null) return 'no date set';
  if (d < 0) return `${Math.abs(d)}d ago`;
  if (d === 0) return 'exam today!';
  return `${d}d until exam`;
};

export default function ExamPrepStrat() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStrat, setActiveStrat] = useState(null);

  // New strategy form
  const [newSubject, setNewSubject] = useState('');
  const [newColor, setNewColor] = useState(SWATCHES[0]);
  const [newExamDate, setNewExamDate] = useState('');

  // New phase form
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseWeeks, setNewPhaseWeeks] = useState('');
  const [newPhaseTasks, setNewPhaseTasks] = useState('');

  // New tip + per-phase task inputs
  const [newTip, setNewTip] = useState('');
  const [taskInputs, setTaskInputs] = useState({});

  // Syllabus upload states (mock)
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [fileName, setFileName] = useState('');

  // Fetch strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const data = await api.get('/api/strategies');
        const mapped = data.map(s => ({
          id: s._id,
          subject: s.subject,
          color: s.color,
          examDate: s.examDate ? s.examDate.split('T')[0] : '',
          phases: s.phases || [],
          tips: s.tips || []
        }));
        setStrategies(mapped);
        if (mapped.length > 0) {
          setActiveStrat(mapped[0].id);
        }
      } catch (err) {
        console.error('Failed to load exam strategies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
  }, []);

  const strat = strategies.find(s => s.id === activeStrat);
  const phases = strat?.phases || [];
  const doneCount = phases.filter(p => p.done).length;
  const overallProgress = phases.length ? Math.round((doneCount / phases.length) * 100) : 0;

  // ---- Strategy CRUD ----
  const addStrategy = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      const payload = {
        subject: newSubject.trim(),
        color: newColor,
        examDate: newExamDate || undefined,
        phases: [],
        tips: []
      };
      const created = await api.post('/api/strategies', payload);
      const newStrat = {
        id: created._id,
        subject: created.subject,
        color: created.color,
        examDate: created.examDate ? created.examDate.split('T')[0] : '',
        phases: created.phases || [],
        tips: created.tips || []
      };
      setStrategies(prev => [...prev, newStrat]);
      setActiveStrat(newStrat.id);
      setNewSubject('');
      setNewExamDate('');
      setNewColor(SWATCHES[0]);
    } catch (err) {
      console.error('Failed to create new exam strategy:', err);
    }
  };

  const deleteStrategy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam preparation strategy?')) return;
    try {
      await api.delete(`/api/strategies/${id}`);
      const remaining = strategies.filter(s => s.id !== id);
      setStrategies(remaining);
      if (activeStrat === id) setActiveStrat(remaining[0]?.id ?? null);
    } catch (err) {
      console.error('Failed to delete strategy:', err);
    }
  };

  // ---- Phase CRUD ----
  const addPhase = async (e) => {
    e.preventDefault();
    if (!strat || !newPhaseName.trim()) return;
    const tasks = newPhaseTasks
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    const nextPhases = [...strat.phases, { phase: newPhaseName.trim(), weeks: newPhaseWeeks.trim(), tasks, done: false }];
    
    try {
      const updated = await api.put(`/api/strategies/${activeStrat}`, { phases: nextPhases });
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, phases: updated.phases } : s));
      setNewPhaseName('');
      setNewPhaseWeeks('');
      setNewPhaseTasks('');
    } catch (err) {
      console.error('Failed to add preparation phase:', err);
    }
  };

  const togglePhase = async (phaseId) => {
    if (!strat) return;
    try {
      const updated = await api.patch(`/api/strategies/${activeStrat}/phases/${phaseId}/toggle`);
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, phases: updated.phases } : s));
    } catch (err) {
      console.error('Failed to toggle phase status:', err);
    }
  };

  const deletePhase = async (phaseId) => {
    if (!window.confirm('Delete this preparation phase?')) return;
    const nextPhases = strat.phases.filter(p => (p._id || p.id) !== phaseId);
    try {
      const updated = await api.put(`/api/strategies/${activeStrat}`, { phases: nextPhases });
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, phases: updated.phases } : s));
    } catch (err) {
      console.error('Failed to delete phase:', err);
    }
  };

  const addTask = async (phaseId) => {
    const value = (taskInputs[phaseId] || '').trim();
    if (!value) return;
    const nextPhases = strat.phases.map(p => (p._id || p.id) === phaseId ? { ...p, tasks: [...p.tasks, value] } : p);
    try {
      const updated = await api.put(`/api/strategies/${activeStrat}`, { phases: nextPhases });
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, phases: updated.phases } : s));
      setTaskInputs({ ...taskInputs, [phaseId]: '' });
    } catch (err) {
      console.error('Failed to append task:', err);
    }
  };

  const deleteTask = async (phaseId, taskIdx) => {
    const nextPhases = strat.phases.map(p => (p._id || p.id) === phaseId ? { ...p, tasks: p.tasks.filter((_, i) => i !== taskIdx) } : p);
    try {
      const updated = await api.put(`/api/strategies/${activeStrat}`, { phases: nextPhases });
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, phases: updated.phases } : s));
    } catch (err) {
      console.error('Failed to remove task:', err);
    }
  };

  // ---- Tips CRUD ----
  const addTip = async (e) => {
    e.preventDefault();
    if (!strat || !newTip.trim()) return;
    const nextTips = [...strat.tips, newTip.trim()];
    try {
      const updated = await api.put(`/api/strategies/${activeStrat}`, { tips: nextTips });
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, tips: updated.tips } : s));
      setNewTip('');
    } catch (err) {
      console.error('Failed to post tip:', err);
    }
  };

  const deleteTip = async (idx) => {
    const nextTips = strat.tips.filter((_, i) => i !== idx);
    try {
      const updated = await api.put(`/api/strategies/${activeStrat}`, { tips: nextTips });
      setStrategies(prev => prev.map(s => s.id === activeStrat ? { ...s, tips: updated.tips } : s));
    } catch (err) {
      console.error('Failed to remove tip:', err);
    }
  };

  // ---- Mock upload parser ----
  const handleSyllabusUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setUploadStatus('Reading your exam syllabus... 📖');
    setTimeout(() => {
      setUploadStatus('Mapping out preparation phases... 🗺️');
      setTimeout(() => {
        setUploadStatus('Ready! Custom phases are ready to be carved below. 🏆');
        setTimeout(() => {
          setUploading(false);
          setUploadStatus('');
          setFileName('');
        }, 1200);
      }, 1200);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="exam-prep-panel text-center py-12">
        <span className="spinner-sketch text-4xl">🔄</span>
        <p className="handwritten text-lg mt-2">Opening exam roadmap ledger...</p>
      </div>
    );
  }

  return (
    <div className="exam-prep-panel">
      <div className="panel-header">
        <h2 className="panel-title">🏆 Exam Preparation Strategy</h2>
        <p className="panel-subtitle">Create a structured weekly prep plan and syllabus milestones.</p>
      </div>

      <div className="exam-prep-layout">
        {/* Left Column: Sidebar with selectors & forms */}
        <div className="exam-prep-sidebar">
          {/* Subject Tab Selector */}
          <div className="strat-tabs-section">
            <h3 className="sidebar-section-title">📚 Active roadmaps</h3>
            <div className="strat-tabs">
              {strategies.map(s => {
                const d = computeDaysLeft(s.examDate);
                return (
                  <div key={s.id}
                    className={`strat-tab sketch-border-sm ${activeStrat === s.id ? 'strat-tab-active' : ''}`}
                    onClick={() => setActiveStrat(s.id)}
                    style={{ '--stab-color': s.color }}>
                    <button className="strat-tab-del" onClick={(e) => { e.stopPropagation(); deleteStrategy(s.id); }} aria-label="delete strategy">✕</button>
                    <span className="stab-name">{s.subject}</span>
                    <span className="stab-days" style={{ color: d !== null && d <= 7 ? '#c62828' : 'var(--wood-ink-muted)' }}>
                      {daysLabel(d)}
                    </span>
                  </div>
                );
              })}
              {strategies.length === 0 && (
                <div className="exam-empty sketch-border-sm">No exam strategies. Create one below!</div>
              )}
            </div>
          </div>

          {/* Add Strategy Form */}
          <form onSubmit={addStrategy} className="add-strat-form sketch-border-sm">
            <h4 className="add-strat-title">➕ Add an Exam Strategy</h4>
            <div className="form-group-sm">
              <label className="text-xxs font-bold">Subject Name *</label>
              <input value={newSubject} onChange={e => setNewSubject(e.target.value)}
                placeholder="e.g. Mathematics" className="form-input sketch-border-sm" required />
            </div>
            <div className="form-group-sm">
              <label className="text-xxs font-bold">Exam Date</label>
              <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)}
                className="form-input sketch-border-sm" />
            </div>
            <div className="form-group-sm">
              <label className="text-xxs font-bold">Theme Color</label>
              <div className="swatch-row">
                {SWATCHES.map(c => (
                  <button type="button" key={c} onClick={() => setNewColor(c)}
                    className={`swatch ${newColor === c ? 'swatch-active' : ''}`}
                    style={{ background: c }} aria-label={`color ${c}`} />
                ))}
              </div>
            </div>
            <button type="submit" className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow mt-3 w-full justify-center exam-submit-btn">
              + Add Strategy
            </button>
          </form>

          {/* Cozy Exam Tips Section */}
          <div className="exam-tips-section sketch-border-sm" style={{ padding: '16px', background: 'var(--wood-card)' }}>
            <h3 className="card-section-title" style={{ fontSize: '15px', marginBottom: '10px' }}>📌 Cozy Expert Tips{strat ? ` for ${strat.subject}` : ''}</h3>
            <div className="tips-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strat?.tips?.length ? strat.tips.map((tip, i) => (
                <div key={i} className="tip-post-it-mini sketch-border-sm" style={{ background: 'var(--note-yellow)', padding: '10px 12px', position: 'relative' }}>
                  <button className="tip-del" style={{ top: '4px', right: '6px' }} onClick={() => deleteTip(i)} aria-label="delete tip">✕</button>
                  <p className="tip-text" style={{ fontSize: '13px', margin: 0, paddingRight: '14px' }}>{tip}</p>
                </div>
              )) : <div className="exam-empty sketch-border-sm" style={{ padding: '8px', fontSize: '12px' }}>{strat ? 'No custom tips yet.' : 'Select a strategy first.'}</div>}
            </div>

            {strat && (
              <form onSubmit={addTip} className="add-tip-form" style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                <input value={newTip} onChange={e => setNewTip(e.target.value)}
                  placeholder="Write a tip…" className="form-input sketch-border-sm" style={{ flex: 1, minHeight: '34px', fontSize: '12px', padding: '4px 8px' }} />
                <button type="submit" className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow exam-tip-btn" style={{ padding: '4px 10px', fontSize: '12px', minHeight: '34px' }}>+ Add</button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Main Roadmap and syllabus details */}
        <div className="exam-prep-main">
          {/* Syllabus Upload Block */}
          <div className="syllabus-upload-card sketch-border sketch-shadow">
            <div className="upload-header">
              <span className="upload-icon">📂</span>
              <div className="upload-text-block">
                <h3 className="font-bold text-base">Autopilot Exam Planner</h3>
                <p className="text-xs text-gray-500">Upload your syllabus PDF/Image to prepare your exam phases.</p>
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

          {strat ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              {/* Overall Completion Bar */}
              <div className="strat-completion-bar-wrap sketch-border-sm" style={{ padding: '16px', background: 'var(--wood-card)' }}>
                <span className="strat-completion-label">
                  Strategy Completion: {overallProgress}% — {strat.subject}
                </span>
                <div className="strat-completion-bar sketch-border-sm" style={{ marginTop: '8px' }}>
                  <div className="strat-completion-fill" style={{ width: `${overallProgress}%`, background: strat.color || 'var(--wood-accent)' }}></div>
                </div>
              </div>

              {/* Phase Roadmap Cards */}
              <div className="phases-timeline">
                {phases.map((p, idx) => {
                  const pId = p._id || p.id;
                  return (
                    <div key={pId} className={`phase-card sketch-border sketch-shadow ${p.done ? 'phase-done' : ''}`} style={{ marginBottom: '14px' }}>
                      {idx < phases.length - 1 && <div className="timeline-connector"></div>}

                      <div className="phase-header">
                        <div className={`phase-circle sketch-border-sm ${p.done ? 'phase-circle-done' : ''}`} onClick={() => togglePhase(pId)}>
                          {p.done
                            ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 4" stroke="#2D2C24" strokeWidth="2.5" strokeLinecap="round" /></svg>
                            : <span className="phase-num">{idx + 1}</span>
                          }
                        </div>
                        <div className="phase-title-block" onClick={() => togglePhase(pId)}>
                          <h4 className="phase-name">{p.phase}</h4>
                          {p.weeks && <span className="phase-weeks handwritten">{p.weeks}</span>}
                        </div>
                        <span className="phase-toggle-btn" onClick={() => togglePhase(pId)}>{p.done ? '✅ Completed' : '○ Mark Done'}</span>
                        <button className="phase-del-btn" style={{ marginLeft: '10px' }} onClick={() => deletePhase(pId)} aria-label="delete phase">🗑️</button>
                      </div>

                      <ul className="phase-tasks" style={{ marginTop: '10px' }}>
                        {p.tasks.map((t, ti) => (
                          <li key={ti} className="phase-task-item sketch-border-sm">
                            <span className="task-bullet" style={{ background: strat.color || 'var(--wood-accent)' }}></span>
                            <span className="task-text">{t}</span>
                            <button className="task-del" onClick={() => deleteTask(pId, ti)} aria-label="delete task">✕</button>
                          </li>
                        ))}
                        <li className="phase-task-add">
                          <input
                            value={taskInputs[pId] || ''}
                            onChange={e => setTaskInputs({ ...taskInputs, [pId]: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(pId); } }}
                            placeholder="Add a milestone task…" className="form-input sketch-border-sm task-add-input" />
                          <button type="button" className="task-add-btn sketch-border-sm" onClick={() => addTask(pId)}>+ Add</button>
                        </li>
                      </ul>
                    </div>
                  );
                })}
                {phases.length === 0 && (
                  <div className="exam-empty sketch-border-sm">No phases yet. Build the preparation roadmap below! 🛠️</div>
                )}
              </div>

              {/* Add Phase Form */}
              <form onSubmit={addPhase} className="add-phase-form sketch-border sketch-shadow">
                <h4 className="add-strat-title">🧩 Add a Preparation Phase to {strat.subject}</h4>
                <div className="add-phase-grid">
                  <div className="form-group-sm">
                    <label className="text-xxs font-bold">Phase Name *</label>
                    <input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)}
                      placeholder="e.g. Foundation Building" className="form-input sketch-border-sm" required />
                  </div>
                  <div className="form-group-sm">
                    <label className="text-xxs font-bold">Duration</label>
                    <input value={newPhaseWeeks} onChange={e => setNewPhaseWeeks(e.target.value)}
                      placeholder="e.g. Weeks 1–2" className="form-input sketch-border-sm" />
                  </div>
                  <div className="form-group-sm full-width">
                    <label className="text-xxs font-bold">Milestone Tasks (one per line)</label>
                    <textarea value={newPhaseTasks} onChange={e => setNewPhaseTasks(e.target.value)}
                      placeholder={"Read core syllabus chapters\nAttempt 2 full mock papers"} rows={3}
                      className="form-input sketch-border-sm" />
                  </div>
                </div>
                <button type="submit" className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow mt-3 w-full justify-center exam-submit-btn">
                  + Add Phase to Roadmap
                </button>
              </form>
            </div>
          ) : (
            <div className="exam-empty sketch-border-sm text-center" style={{ padding: '40px', marginTop: '20px', background: 'var(--wood-card)' }}>
              <span style={{ fontSize: '40px' }}>🏆</span>
              <h3 style={{ fontSize: '18px', marginTop: '12px' }}>Choose or Create an Exam Strategy</h3>
              <p className="handwritten" style={{ fontSize: '16px', color: 'var(--wood-ink-muted)', marginTop: '4px' }}>
                Select a subject roadmap from the left panel, or carve a new strategy branch to build your timeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
