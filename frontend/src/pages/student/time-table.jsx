import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import '../../styles/student/time-table.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

const subjectColors = {
  Focus: { bg: 'var(--wood-sage)', border: '#88C088' },
  Practice: { bg: 'var(--wood-accent)', border: '#E6A817' },
  Notes: { bg: 'var(--wood-clay)', border: '#F4A261' },
  Review: { bg: 'var(--wood-sky)', border: '#A8DADC' },
  Break: { bg: '#F3E5F5', border: '#CE93D8' },
  CatchUp: { bg: '#FFF9C4', border: '#F9A825' },
};

export default function TimeTable() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day: 'Monday', start: '8:00 AM', end: '9:00 AM', subject: 'Focus', note: '' });

  // Fetch timetable blocks on mount
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const data = await api.get('/api/timetable');
        setBlocks(data.map(b => ({
          id: b._id,
          day: b.day,
          start: b.start,
          end: b.end,
          subject: b.subject,
          note: b.note || ''
        })));
      } catch (err) {
        console.error('Failed to load timetable blocks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlocks();
  }, []);

  const dayBlocks = blocks.filter(b => b.day === activeDay);

  const addBlock = async (e) => {
    e.preventDefault();
    try {
      const created = await api.post('/api/timetable', form);
      setBlocks(prev => [...prev, {
        id: created._id,
        day: created.day,
        start: created.start,
        end: created.end,
        subject: created.subject,
        note: created.note || ''
      }]);
      setForm({ day: activeDay, start: '8:00 AM', end: '9:00 AM', subject: 'Focus', note: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create timetable block:', err);
    }
  };

  const removeBlock = async (id) => {
    try {
      await api.delete(`/api/timetable/${id}`);
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete timetable block:', err);
    }
  };

  // Total weekly study hours (excluding break)
  const studyBlocks = blocks.filter(b => b.subject !== 'Break');
  const totalHours = studyBlocks.length * 1.5; // rough estimate

  if (loading) {
    return (
      <div className="timetable-panel text-center py-12">
        <span className="spinner-sketch text-4xl">🔄</span>
        <p className="handwritten text-lg mt-2">Opening weekly schedules book...</p>
      </div>
    );
  }

  return (
    <div className="timetable-panel">
      <div className="panel-header">
        <h2 className="panel-title">⏰ Hourglass Timetable</h2>
        <p className="panel-subtitle">Add your own focus blocks to shape the week.</p>
      </div>

      {/* Quick Stats Strip */}
      <div className="tt-stats-strip">
        <div className="tt-stat sketch-border-sm">
          <span className="tt-stat-val">{blocks.filter(b => b.subject !== 'Break').length}</span>
          <span className="tt-stat-label">Study Blocks</span>
        </div>
        <div className="tt-stat sketch-border-sm">
          <span className="tt-stat-val">{blocks.filter(b => b.subject === 'Break').length}</span>
          <span className="tt-stat-label">Break Slots</span>
        </div>
        <div className="tt-stat sketch-border-sm">
          <span className="tt-stat-val">~{Math.round(totalHours)}h</span>
          <span className="tt-stat-label">Est. Study Time</span>
        </div>
        <div className="tt-stat sketch-border-sm" style={{ background: 'var(--wood-accent)' }}>
          <span className="tt-stat-val">{days.filter(d => blocks.some(b => b.day === d)).length}/7</span>
          <span className="tt-stat-label">Active Days</span>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="day-tabs">
        {days.map(d => (
          <button key={d} onClick={() => { setActiveDay(d); setShowForm(false); setForm(prev => ({ ...prev, day: d })); }}
            className={`day-tab sketch-border-sm ${activeDay === d ? 'day-tab-active' : ''}`}>
            <span className="day-short">{d.slice(0, 3)}</span>
            <span className="day-block-count">{blocks.filter(b => b.day === d).length}</span>
          </button>
        ))}
      </div>

      {/* Day View */}
      <div className="day-view-wrap sketch-border sketch-shadow">
        <div className="day-view-header">
          <h3 className="day-view-title">{activeDay}</h3>
          <button onClick={() => setShowForm(!showForm)}
            className="btn-sketch btn-sketch-primary sketch-border-sm sketch-shadow">
            {showForm ? '✕ Cancel' : '+ Add Block'}
          </button>
        </div>

        {/* Add Block Form */}
        {showForm && (
          <form onSubmit={addBlock} className="add-block-form sketch-border-sm">
            <div className="add-block-tape"></div>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <select value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="form-input sketch-border-sm">
                  {timeSlots.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <select value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} className="form-input sketch-border-sm">
                  {timeSlots.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="form-input sketch-border-sm">
                  {Object.keys(subjectColors).filter(s => s !== 'Break').map(s => <option key={s}>{s}</option>)}
                  <option value="Break">Break</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Focus Note (optional)</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="What will you focus on?" className="form-input sketch-border-sm" />
            </div>
            <button type="submit" className="btn-sketch btn-sketch-primary sketch-border sketch-shadow">Carve This Block</button>
          </form>
        )}

        {/* Block List */}
        {dayBlocks.length === 0 ? (
          <div className="tt-empty sketch-border-sm">
            <span style={{ fontSize: 36 }}>🌿</span>
            <p className="handwritten" style={{ fontSize: 20 }}>No blocks yet. Add your own focus block to begin.</p>
          </div>
        ) : (
          <div className="block-timeline">
            {dayBlocks.sort((a, b) => timeSlots.indexOf(a.start) - timeSlots.indexOf(b.start)).map(block => {
              const col = subjectColors[block.subject] || subjectColors['Focus'];
              return (
                <div key={block.id} className="time-block sketch-border-sm"
                  style={{ background: col.bg, borderLeft: `5px solid ${col.border}` }}>
                  <div className="block-time-col">
                    <span className="block-start">{block.start}</span>
                    <div className="block-arrow">↓</div>
                    <span className="block-end">{block.end}</span>
                  </div>
                  <div className="block-content">
                    <h4 className="block-subject">{block.subject}</h4>
                    {block.note && <p className="block-note handwritten">✏️ {block.note}</p>}
                  </div>
                  <button className="block-delete-btn" onClick={() => removeBlock(block.id)} title="Remove block">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Mini Overview */}
      <div className="weekly-overview sketch-border sketch-shadow">
        <h3 className="card-section-title">📅 Full Week Overview</h3>
        <div className="week-grid">
          {days.map(d => (
            <div key={d} className="week-day-col">
              <div className="week-day-label">{d.slice(0, 3)}</div>
              <div className="week-day-blocks">
                {blocks.filter(b => b.day === d).sort((a, b) => timeSlots.indexOf(a.start) - timeSlots.indexOf(b.start)).map(b => {
                  const col = subjectColors[b.subject] || subjectColors['Focus'];
                  return (
                    <div key={b.id} className="mini-block sketch-border-sm"
                      style={{ background: col.bg, borderLeft: `3px solid ${col.border}` }}
                      title={`${b.subject}: ${b.start}–${b.end}`}>
                      <span className="mini-block-text">{b.subject.slice(0, 3)}</span>
                    </div>
                  );
                })}
                {blocks.filter(b => b.day === d).length === 0 && (
                  <div className="mini-block-empty">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .timetable-panel { display: flex; flex-direction: column; gap: 24px; }
        .tt-stats-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 600px) { .tt-stats-strip { grid-template-columns: repeat(2,1fr); } }
        .tt-stat { background: var(--wood-card); padding: 14px; text-align: center; display: flex; flex-direction: column; gap: 4px; }
        .tt-stat-val { font-family: var(--heading); font-size: 24px; font-weight: 700; }
        .tt-stat-label { font-size: 11px; color: var(--wood-ink-muted); font-family: var(--heading); }
        .day-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .day-tab { background: var(--wood-card); border: 2px solid var(--wood-ink); padding: 10px 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; flex-shrink: 0; transition: all 0.2s; }
        .day-tab:hover { background: var(--wood-accent); transform: translateY(-2px); }
        .day-tab.day-tab-active { background: var(--wood-primary); box-shadow: 3px 3px 0 var(--wood-ink); }
        .day-short { font-family: var(--heading); font-weight: 700; font-size: 14px; }
        .day-block-count { font-size: 11px; background: var(--wood-card); border: 1px solid var(--wood-ink); border-radius: 10px; padding: 0 6px; }
        .day-view-wrap { background: var(--wood-card); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .day-view-header { display: flex; justify-content: space-between; align-items: center; }
        .day-view-title { font-family: var(--heading); font-size: 22px; font-weight: 700; }
        .add-block-form { background: var(--wood-bg); padding: 22px; display: flex; flex-direction: column; gap: 14px; position: relative; }
        .add-block-tape { position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(-1deg); width: 80px; height: 20px; background: rgba(253,242,204,0.7); border: 1px dashed rgba(45,44,36,0.2); }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) { .form-grid-3 { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-family: var(--heading); font-weight: 600; font-size: 13px; }
        .form-input { padding: 9px 12px; font-family: var(--sans); font-size: 14px; background: var(--wood-card); color: var(--wood-ink); border: 2px solid var(--wood-ink); outline: none; box-sizing: border-box; width: 100%; }
        .form-input:focus { background: #FFFDF0; }
        .block-timeline { display: flex; flex-direction: column; gap: 10px; }
        .time-block { padding: 14px 16px; display: flex; align-items: center; gap: 16px; transition: all 0.2s; }
        .time-block:hover { transform: translateX(4px); }
        .block-time-col { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; width: 64px; }
        .block-start, .block-end { font-family: var(--heading); font-size: 12px; font-weight: 700; color: var(--wood-ink); }
        .block-arrow { font-size: 12px; color: var(--wood-ink-muted); }
        .block-content { flex: 1; }
        .block-subject { font-family: var(--heading); font-size: 16px; font-weight: 700; margin-bottom: 3px; }
        .block-note { font-size: 15px; color: var(--wood-ink-muted); }
        .block-delete-btn { background: none; border: none; cursor: pointer; color: var(--wood-ink-muted); font-size: 16px; padding: 4px 8px; flex-shrink: 0; }
        .block-delete-btn:hover { color: #c62828; }
        .tt-empty { background: var(--wood-bg); padding: 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .weekly-overview { background: var(--wood-card); padding: 24px; }
        .card-section-title { font-family: var(--heading); font-size: 18px; margin-bottom: 16px; }
        .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
        @media (max-width: 700px) { .week-grid { grid-template-columns: repeat(3, 1fr); } }
        .week-day-col { display: flex; flex-direction: column; gap: 6px; }
        .week-day-label { font-family: var(--heading); font-size: 12px; font-weight: 700; text-align: center; color: var(--wood-ink-muted); padding-bottom: 4px; border-bottom: 2px dashed var(--wood-border-light); }
        .week-day-blocks { display: flex; flex-direction: column; gap: 4px; }
        .mini-block { padding: 5px 7px; display: flex; align-items: center; }
        .mini-block-text { font-size: 10px; font-family: var(--heading); font-weight: 700; color: var(--wood-ink); }
        .mini-block-empty { text-align: center; font-size: 12px; color: var(--wood-border-light); padding: 5px 0; }
      `}</style>
    </div>
  );
}
