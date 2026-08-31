'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://natqbwulzzwirbksrvje.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rqWj3rTG0JIy8kNfpkZPqQ_zbI6K4gt';
const API_URL = `${SUPABASE_URL}/functions/v1/factory-api`;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function api(key, action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-factory-key': key },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function Page() {
  const [key, setKey] = useState('');
  const [enteredKey, setEnteredKey] = useState('');
  const [ok, setOk] = useState(false);
  const [projects, setProjects] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('Funny Reaction Video');
  const [topic, setTopic] = useState('funny fails');
  const [targetLength, setTargetLength] = useState('10');
  const [reactionLabel, setReactionLabel] = useState('laugh');

  const selectedProject = useMemo(() => projects.find((p) => p.id === selected) || null, [projects, selected]);

  async function refresh(useKey = key) {
    const [p, r] = await Promise.all([api(useKey, 'listProjects'), api(useKey, 'listReactions')]);
    setProjects(p.projects || []);
    setReactions(r.reactions || []);
    if (!selected && p.projects?.[0]) setSelected(p.projects[0].id);
  }

  async function login(e) {
    e.preventDefault();
    setBusy(true); setMessage('Checking passcode...');
    try {
      await api(enteredKey, 'health');
      setKey(enteredKey); setOk(true); setMessage('');
      await refresh(enteredKey);
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function createProject(e) {
    e.preventDefault();
    setBusy(true); setMessage('Creating project...');
    try {
      const result = await api(key, 'createProject', { name, topic, targetLength });
      await refresh();
      setSelected(result.project.id);
      setMessage('Project created. Upload the source video next.');
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function uploadProjectFile(file, kind) {
    if (!selectedProject) return setMessage('Create or select a project first.');
    if (!file) return;
    setBusy(true); setMessage(`Uploading ${kind}...`);
    try {
      const signed = await api(key, 'createUpload', { projectId: selectedProject.id, kind, filename: file.name });
      const { error } = await supabase.storage.from('youtube-factory-assets').uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || 'video/mp4' });
      if (error) throw error;
      await api(key, 'markProjectUpload', { projectId: selectedProject.id, kind, path: signed.path });
      await refresh();
      setMessage(`${kind === 'source' ? 'Source' : 'Reaction'} uploaded.`);
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function addReaction(file) {
    if (!file) return;
    setBusy(true); setMessage('Adding reaction to Reaction Factory...');
    try {
      const signed = await api(key, 'createReactionUpload', { filename: file.name, label: reactionLabel });
      const { error } = await supabase.storage.from('youtube-factory-assets').uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || 'video/mp4' });
      if (error) throw error;
      await api(key, 'markReactionUpload', { path: signed.path, label: signed.label });
      await refresh();
      setMessage('Reaction clip added to the reusable library.');
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function useFactory() {
    if (!selectedProject) return setMessage('Select a project first.');
    setBusy(true); setMessage('Choosing the best reaction...');
    try {
      const result = await api(key, 'useReactionFactory', { projectId: selectedProject.id });
      await refresh();
      setMessage(`Selected reaction: ${result.reaction.label}`);
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  async function queueProject() {
    if (!selectedProject) return setMessage('Select a project first.');
    setBusy(true); setMessage('Queueing video processing...');
    try {
      await api(key, 'queueProject', { projectId: selectedProject.id });
      await refresh();
      setMessage('Queued. The render worker is the next piece to connect.');
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  if (!ok) {
    return <main className="loginWrap"><section className="loginCard"><div className="eyebrow">PRIVATE BETA</div><h1>YouTube Factory</h1><p>Enter the Factory passcode to open the real dashboard.</p><form onSubmit={login}><input type="password" value={enteredKey} onChange={(e)=>setEnteredKey(e.target.value)} placeholder="Factory passcode" autoFocus/><button disabled={busy}>{busy ? 'Checking...' : 'Open Factory'}</button></form>{message && <p className="msg error">{message}</p>}</section></main>;
  }

  return <main>
    <header><div><div className="eyebrow">PRIVATE BETA</div><h1>YouTube Factory</h1><p>Funny reaction long videos • upload → reaction → queue → render</p></div><div className="status">LIVE</div></header>

    {message && <div className="notice">{message}</div>}

    <div className="grid two">
      <section className="card">
        <h2>Create Project</h2>
        <form onSubmit={createProject}>
          <label>Project name</label><input value={name} onChange={(e)=>setName(e.target.value)} required/>
          <label>Topic</label><input value={topic} onChange={(e)=>setTopic(e.target.value)} />
          <label>Target length</label><select value={targetLength} onChange={(e)=>setTargetLength(e.target.value)}><option value="">Auto</option><option value="8">8 min</option><option value="10">10 min</option><option value="12">12 min</option><option value="15">15 min</option></select>
          <button disabled={busy}>Create Video Project</button>
        </form>
      </section>

      <section className="card">
        <h2>Reaction Factory</h2>
        <p>{reactions.length} reusable reaction clip{reactions.length === 1 ? '' : 's'} saved.</p>
        <div className="row"><select value={reactionLabel} onChange={(e)=>setReactionLabel(e.target.value)}><option>laugh</option><option>shock</option><option>smile</option><option>cringe</option><option>confused</option><option>funny</option><option>wow</option></select><label className="fileBtn">Add Reaction<input type="file" accept="video/mp4,video/quicktime" onChange={(e)=>addReaction(e.target.files?.[0])}/></label></div>
        <button className="secondary" disabled={busy || !selectedProject} onClick={useFactory}>Auto Pick for Selected Project</button>
      </section>
    </div>

    <section className="card projects">
      <div className="sectionHead"><div><h2>Projects</h2><p>Select one to upload and process.</p></div><button className="secondary" onClick={()=>refresh()} disabled={busy}>Refresh</button></div>
      <div className="projectList">{projects.length === 0 ? <div className="empty">No projects yet.</div> : projects.map((p)=><button key={p.id} className={`projectItem ${selected===p.id?'active':''}`} onClick={()=>setSelected(p.id)}><span><b>{p.name}</b><small>{p.topic || 'No topic'}</small></span><span><b>{p.status}</b><small>{p.progress}%</small></span></button>)}</div>
    </section>

    {selectedProject && <section className="card workspace">
      <div className="sectionHead"><div><div className="eyebrow">SELECTED PROJECT</div><h2>{selectedProject.name}</h2><p>{selectedProject.topic || 'No topic'} • {selectedProject.target_length_minutes || 'Auto'} min</p></div><div className="progress"><span style={{width:`${selectedProject.progress}%`}}/></div></div>
      <div className="grid three">
        <div className="uploadBox"><h3>1. Source Video</h3><p>{selectedProject.source_path ? 'Uploaded ✓' : 'Upload MP4/MOV'}</p><label className="fileBtn primary">Upload Source<input type="file" accept="video/mp4,video/quicktime" onChange={(e)=>uploadProjectFile(e.target.files?.[0], 'source')}/></label></div>
        <div className="uploadBox"><h3>2. Reaction</h3><p>{selectedProject.reaction_label ? `Factory: ${selectedProject.reaction_label} ✓` : selectedProject.reaction_path ? 'Uploaded ✓' : 'Use Factory or upload'}</p><div className="stack"><button className="secondary" onClick={useFactory} disabled={busy}>Use Reaction Factory</button><label className="fileBtn">Upload Reaction<input type="file" accept="video/mp4,video/quicktime" onChange={(e)=>uploadProjectFile(e.target.files?.[0], 'reaction')}/></label></div></div>
        <div className="uploadBox"><h3>3. Create Video</h3><p>Status: {selectedProject.status}</p><button disabled={busy || !selectedProject.source_path || !selectedProject.reaction_path} onClick={queueProject}>Queue Full Pipeline</button></div>
      </div>
      {selectedProject.error && <p className="msg error">{selectedProject.error}</p>}
    </section>}

    <section className="card pipeline"><h2>Pipeline</h2><div className="steps">{['Upload','Normalize','Transcribe','Analyze','Edit','Render','Captions','Thumbnail','Metadata','YouTube'].map((s,i)=><span key={s}>{i+1}. {s}</span>)}</div><p>The dashboard, private storage, Reaction Factory library and job queue are connected. The FFmpeg render worker is next.</p></section>
  </main>;
}
