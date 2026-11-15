"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";

type StoryboardShot = { scene: string; visual: string; camera: string; dialogue: string; imagePrompt: string; canvasX?: number; canvasY?: number };
type GenerationResult = { title: string; logline: string; characters: { name: string; description: string }[]; script: string; storyboard: StoryboardShot[]; voiceover: string; videoPrompt: string };
type Point = { x: number; y: number };
type CanvasMedia = { id: string; name: string; mimeType: string; kind: "image" | "video" };
type ProjectRecord = { id: string; name: string; title: string; idea: string; genre: string; duration: number; shotCount: number; result: GenerationResult; positions: Record<string, Point>; media?: CanvasMedia[]; createdAt: string; updatedAt: string };
type Viewport = { x: number; y: number; scale: number };
type Gesture = { kind: "pan"; pointerX: number; pointerY: number; originX: number; originY: number } | { kind: "node"; id: string; pointerX: number; pointerY: number; originX: number; originY: number } | null;

const STORAGE_KEY = "ai-comic-studio-projects-v2";
const MEDIA_DB = "ai-comic-studio-media";
const MEDIA_STORE = "files";
const workflowSteps = ["故事设定", "剧本创作", "分镜设计", "配音文案", "生成提示词"];
const emptyResult = (): GenerationResult => ({ title: "", logline: "", characters: [], script: "", storyboard: [], voiceover: "", videoPrompt: "" });
const initialPositions: Record<string, Point> = { idea: { x: 70, y: 170 }, script: { x: 440, y: 170 }, export: { x: 1660, y: 170 } };

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(MEDIA_STORE)) request.result.createObjectStore(MEDIA_STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("无法打开本地媒体存储"));
  });
}
async function saveMediaBlob(id: string, blob: Blob): Promise<void> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MEDIA_STORE, "readwrite");
    transaction.objectStore(MEDIA_STORE).put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("保存媒体文件失败"));
    transaction.onabort = () => reject(transaction.error || new Error("保存媒体文件失败"));
  });
  db.close();
}
async function readMediaBlob(id: string): Promise<Blob | undefined> {
  const db = await openMediaDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(MEDIA_STORE, "readonly").objectStore(MEDIA_STORE).get(id);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error || new Error("读取媒体文件失败"));
  });
  db.close();
  return blob;
}
async function deleteMediaBlob(id: string): Promise<void> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MEDIA_STORE, "readwrite");
    transaction.objectStore(MEDIA_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("删除媒体文件失败"));
  });
  db.close();
}
function makeProject(name = "未命名漫剧项目"): ProjectRecord {
  const now = new Date().toISOString();
  return { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, title: "新漫剧项目", idea: "", genre: "奇幻", duration: 3, shotCount: 5, result: emptyResult(), positions: { ...initialPositions }, media: [], createdAt: now, updatedAt: now };
}
const firstProject: ProjectRecord = { id: "local-welcome-project", name: "我的第一个项目", title: "新漫剧项目", idea: "在这里写下你的故事创意。你可以先搭建工作流、添加分镜并编辑内容，不需要配置 AI API。", genre: "奇幻", duration: 3, shotCount: 5, result: emptyResult(), positions: { ...initialPositions }, media: [], createdAt: "", updatedAt: "" };
function nodePosition(project: ProjectRecord, id: string): Point {
  const saved = project.positions?.[id];
  if (saved) return saved;
  if (id.startsWith("shot-")) { const index = Number(id.slice(5)); return { x: 850 + (index % 2) * 350, y: 145 + Math.floor(index / 2) * 350 }; }
  if (id.startsWith("media-")) { const index = Math.max(0, (project.media || []).findIndex((item) => item.id === id.slice(6))); return { x: 850 + (index % 2) * 350, y: 145 + Math.floor(index / 2) * 350 }; }
  return initialPositions[id] || { x: 70, y: 170 };
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectRecord[]>([firstProject]);
  const [selectedId, setSelectedId] = useState(firstProject.id);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, scale: 0.82 });
  const gesture = useRef<Gesture>(null);
  const canvasPanelRef = useRef<HTMLElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedId) || projects[0] || null, [projects, selectedId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          const loaded = (parsed as ProjectRecord[]).map((project) => ({ ...project, positions: project.positions || { ...initialPositions }, media: project.media || [] }));
          setProjects(loaded); setSelectedId(loaded[0].id);
        }
      }
    } catch { /* Use the starter project if local storage is unavailable or invalid. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); }
    catch { setError("本地项目保存失败。媒体文件保存在浏览器数据库中，项目列表需要浏览器本地存储空间。"); }
  }, [projects, ready]);
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    async function loadPreviews() {
      const next: Record<string, string> = {};
      for (const media of selectedProject?.media || []) {
        try {
          const blob = await readMediaBlob(media.id);
          if (blob) { const url = URL.createObjectURL(blob); created.push(url); next[media.id] = url; }
        } catch { /* Missing media is shown with a helpful placeholder. */ }
      }
      if (cancelled) created.forEach(URL.revokeObjectURL);
      else setMediaUrls(next);
    }
    void loadPreviews();
    return () => { cancelled = true; created.forEach(URL.revokeObjectURL); };
  }, [selectedProject?.id, selectedProject?.media]);
  useEffect(() => {
    const onFullscreenChange = () => setIsCanvasFullscreen(document.fullscreenElement === canvasPanelRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function updateSelected(updater: (project: ProjectRecord) => ProjectRecord) {
    if (!selectedProject) return;
    setProjects((current) => current.map((project) => project.id === selectedProject.id ? updater({ ...project, updatedAt: new Date().toISOString() }) : project));
  }
  function createProject() {
    const project = makeProject(); setProjects((current) => [project, ...current]); setSelectedId(project.id); setView({ x: 0, y: 0, scale: 0.82 }); setError("");
  }
  function deleteProject() {
    if (!selectedProject || !window.confirm(`删除“${selectedProject.name}”？`)) return;
    const remaining = projects.filter((project) => project.id !== selectedProject.id);
    if (!remaining.length) { const replacement = makeProject("我的第一个项目"); setProjects([replacement]); setSelectedId(replacement.id); }
    else { setProjects(remaining); setSelectedId(remaining[0].id); }
  }
  async function importMedia(event: ChangeEvent<HTMLInputElement>, kind: "image" | "video") {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedProject || !files.length) return;
    setError("");
    const added: CanvasMedia[] = [];
    try {
      for (const file of files) {
        if (kind === "image" && !file.type.startsWith("image/")) continue;
        if (kind === "video" && !file.type.startsWith("video/")) continue;
        const id = `media-${selectedProject.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await saveMediaBlob(id, file);
        added.push({ id, name: file.name, mimeType: file.type || (kind === "image" ? "image/*" : "video/*"), kind });
      }
      if (!added.length) { setError(`没有导入有效的${kind === "image" ? "图片" : "视频"}文件。`); return; }
      const firstIndex = (selectedProject.media || []).length;
      updateSelected((project) => {
        const positions = { ...project.positions };
        added.forEach((media, offset) => { const index = firstIndex + offset; positions[`media-${media.id}`] = { x: 850 + (index % 2) * 350, y: 145 + Math.floor(index / 2) * 350 }; });
        return { ...project, positions, media: [...(project.media || []), ...added] };
      });
    } catch (err) {
      setError(err instanceof Error ? `导入失败：${err.message}` : "导入媒体失败。请检查浏览器存储空间。");
    }
  }
  async function removeMedia(media: CanvasMedia) {
    try { await deleteMediaBlob(media.id); }
    catch { /* Remove the reference even if the cached blob is already missing. */ }
    const url = mediaUrls[media.id];
    if (url) URL.revokeObjectURL(url);
    setMediaUrls((current) => { const next = { ...current }; delete next[media.id]; return next; });
    updateSelected((project) => { const positions = { ...project.positions }; delete positions[`media-${media.id}`]; return { ...project, positions, media: (project.media || []).filter((item) => item.id !== media.id) }; });
  }
  function addShot() {
    if (!selectedProject) return;
    const index = selectedProject.result.storyboard.length;
    const point = { x: 850 + (index % 2) * 350, y: 145 + Math.floor(index / 2) * 350 };
    updateSelected((project) => ({ ...project, result: { ...project.result, storyboard: [...project.result.storyboard, { scene: `新分镜 ${index + 1}`, visual: "", camera: "中景", dialogue: "", imagePrompt: "", canvasX: point.x, canvasY: point.y }] } }));
  }
  function updateShot(index: number, field: keyof StoryboardShot, value: string | number) {
    updateSelected((project) => { const storyboard = [...project.result.storyboard]; storyboard[index] = { ...storyboard[index], [field]: value }; return { ...project, result: { ...project.result, storyboard } }; });
  }
  function removeShot(index: number) { updateSelected((project) => ({ ...project, result: { ...project.result, storyboard: project.result.storyboard.filter((_, itemIndex) => itemIndex !== index) } })); }
  async function toggleFullscreen() {
    const element = canvasPanelRef.current; if (!element) return;
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await element.requestFullscreen(); }
    catch { setError("浏览器无法进入全屏模式；请尝试使用浏览器的全屏快捷键。"); }
  }
  async function generatePlan() {
    if (!selectedProject) return;
    if (!selectedProject.idea.trim()) { setError("先在故事创意节点填写内容；你也可以不调用 AI，直接编辑画布节点。"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: selectedProject.idea, genre: selectedProject.genre, duration: selectedProject.duration, shotCount: selectedProject.shotCount }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `生成请求失败（${response.status}）`);
      const storyboard: StoryboardShot[] = Array.isArray(data.storyboard) ? data.storyboard.map((shot: StoryboardShot, index: number) => ({ ...shot, scene: shot.scene || `分镜 ${index + 1}`, canvasX: shot.canvasX ?? (850 + (index % 2) * 350), canvasY: shot.canvasY ?? (145 + Math.floor(index / 2) * 350) })) : [];
      updateSelected((project) => ({ ...project, title: data.title || project.title, result: { title: data.title || project.title, logline: data.logline || "", characters: Array.isArray(data.characters) ? data.characters : [], script: data.script || "", storyboard, voiceover: data.voiceover || "", videoPrompt: data.videoPrompt || "" } }));
    } catch (err) { setError(err instanceof Error ? err.message : "AI 生成失败。画布和本地编辑仍可继续使用。"); }
    finally { setLoading(false); }
  }
  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".workflow-node, .canvas-toolbar, button, input, textarea, select")) return;
    event.currentTarget.setPointerCapture(event.pointerId); gesture.current = { kind: "pan", pointerX: event.clientX, pointerY: event.clientY, originX: view.x, originY: view.y };
  }
  function startNodeDrag(event: ReactPointerEvent<HTMLDivElement>, id: string) {
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    const point = nodePosition(selectedProject!, id); gesture.current = { kind: "node", id, pointerX: event.clientX, pointerY: event.clientY, originX: point.x, originY: point.y };
  }
  function moveCanvas(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current; if (!current) return;
    const dx = event.clientX - current.pointerX; const dy = event.clientY - current.pointerY;
    if (current.kind === "pan") { setView((previous) => ({ ...previous, x: current.originX + dx, y: current.originY + dy })); return; }
    const x = current.originX + dx / view.scale; const y = current.originY + dy / view.scale;
    updateSelected((project) => ({ ...project, positions: { ...project.positions, [current.id]: { x, y } }, result: current.id.startsWith("shot-") ? { ...project.result, storyboard: project.result.storyboard.map((shot, index) => Number(current.id.slice(5)) === index ? { ...shot, canvasX: x, canvasY: y } : shot) } : project.result }));
  }
  function zoomCanvas(amount: number) { setView((previous) => ({ ...previous, scale: Math.min(1.5, Math.max(0.35, previous.scale + amount)) })); }
  function updateField<K extends "name" | "title" | "idea" | "genre" | "duration" | "shotCount">(field: K, value: ProjectRecord[K]) { updateSelected((project) => ({ ...project, [field]: value })); }
  function updateResultField<K extends keyof GenerationResult>(field: K, value: GenerationResult[K]) { updateSelected((project) => ({ ...project, result: { ...project.result, [field]: value } })); }
  if (!selectedProject) return null;
  const shots = selectedProject.result.storyboard;
  const media = selectedProject.media || [];
  const positions = (id: string) => nodePosition(selectedProject, id);
  const edges = [["idea", "script"], ...(shots.length ? [["script", "shot-0"]] : [["script", "export"]]), ...shots.slice(0, -1).map((_, index) => [`shot-${index}`, `shot-${index + 1}`]), ...(shots.length ? [[`shot-${shots.length - 1}`, "export"]] : [])];
  const fullscreenStyle = isCanvasFullscreen ? { display: "flex", flexDirection: "column" as const, width: "100vw", height: "100vh", maxWidth: "none", padding: "16px", border: 0, borderRadius: 0, background: "#0b0e17" } : undefined;
  const viewportStyle = isCanvasFullscreen ? { flex: 1, height: "auto", minHeight: 0 } : undefined;

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">✦</span><div><p className="eyebrow">AI COMIC STUDIO</p><h1>漫剧工作流画布</h1></div></div><div className="header-actions"><span className="local-badge"><i /> 本地自动保存 · 无需 AI API</span><button className="secondary-button" onClick={createProject}>＋ 新建项目</button><button className="secondary-button danger" onClick={deleteProject}>删除项目</button></div></header>
    <div className="workspace">
      <aside className="sidebar panel"><div className="sidebar-header"><h2>项目列表</h2><button className="icon-button" onClick={createProject} aria-label="新建项目">＋</button></div><div className="project-list">{projects.map((project) => <button key={project.id} className={`project-item ${project.id === selectedProject.id ? "selected" : ""}`} onClick={() => { setSelectedId(project.id); setError(""); }}><strong>{project.name || project.title}</strong><span>{project.updatedAt ? project.updatedAt.slice(0, 10) : "本地项目"}</span></button>)}</div><div className="sidebar-hint">拖动空白处平移画布<br />滚轮缩放 · 拖动节点调整位置<br />内容自动保存在当前浏览器</div></aside>
      <section className="main-column">
        <section className="panel project-settings"><div className="section-heading"><div><p className="eyebrow">PROJECT SETUP</p><h2>故事设定</h2></div><button className="primary-button generate-button" onClick={() => void generatePlan()} disabled={loading}>{loading ? "生成中…" : "✦ 使用 AI 生成方案（可选）"}</button></div><div className="settings-grid"><label className="field-group">项目名称<input className="text-input" value={selectedProject.name} onChange={(event) => updateField("name", event.target.value)} /></label><label className="field-group">作品标题<input className="text-input" value={selectedProject.title} onChange={(event) => updateField("title", event.target.value)} /></label><label className="field-group">题材<select className="select-box" value={selectedProject.genre} onChange={(event) => updateField("genre", event.target.value)}>{"奇幻,都市,科幻,悬疑,恋爱,热血".split(",").map((genre) => <option key={genre}>{genre}</option>)}</select></label><label className="field-group">时长<select className="select-box" value={selectedProject.duration} onChange={(event) => updateField("duration", Number(event.target.value))}>{[1, 3, 5, 8, 10, 15].map((duration) => <option key={duration} value={duration}>{duration} 分钟</option>)}</select></label><label className="field-group shot-count-field">分镜数量 <span className="range-value">{selectedProject.shotCount}</span><input type="range" min="3" max="8" value={selectedProject.shotCount} onChange={(event) => updateField("shotCount", Number(event.target.value))} /></label></div>{error && <p className="error-box">{error}</p>}</section>
        <section ref={canvasPanelRef} className={`panel canvas-panel${isCanvasFullscreen ? " canvas-panel-fullscreen" : ""}`} style={fullscreenStyle}><div className="canvas-heading"><div><p className="eyebrow">VISUAL WORKFLOW</p><h2>无限工作流画布</h2><p>导入本地图片和视频，直接作为画布素材节点使用。</p></div><div className="canvas-toolbar"><input ref={imageInputRef} className="media-file-input" type="file" accept="image/*" multiple onChange={(event) => void importMedia(event, "image")} /><input ref={videoInputRef} className="media-file-input" type="file" accept="video/*" multiple onChange={(event) => void importMedia(event, "video")} /><button className="canvas-action" onClick={() => imageInputRef.current?.click()}>▧ 导入图片</button><button className="canvas-action" onClick={() => videoInputRef.current?.click()}>▶ 导入视频</button><button className="canvas-action" onClick={addShot}>＋ 添加分镜</button><button className="canvas-action" onClick={() => zoomCanvas(-0.12)} aria-label="缩小">−</button><span className="zoom-label">{Math.round(view.scale * 100)}%</span><button className="canvas-action" onClick={() => zoomCanvas(0.12)} aria-label="放大">＋</button><button className="canvas-action" onClick={() => setView({ x: 0, y: 0, scale: 0.82 })}>重置视图</button><button className="canvas-action" onClick={() => void toggleFullscreen()} aria-label={isCanvasFullscreen ? "退出全屏" : "进入全屏"}>{isCanvasFullscreen ? "⤢ 退出全屏" : "⛶ 全屏"}</button></div></div>
          <div className="workflow-legend"><span><i className="legend-dot idea-dot" />输入节点</span><span><i className="legend-dot process-dot" />创作节点</span><span><i className="legend-dot output-dot" />输出节点</span><span className="legend-help">拖拽节点和画布，滚轮缩放 · 支持本地图片/视频</span></div>
          <div className="canvas-viewport" style={viewportStyle} onPointerDown={startPan} onPointerMove={moveCanvas} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onWheel={(event) => { event.preventDefault(); zoomCanvas(event.deltaY < 0 ? 0.06 : -0.06); }}><div className="canvas-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            <svg className="connection-layer" width="5000" height="3000" aria-hidden="true"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#8b7ba9" /></marker></defs>{edges.map(([from, to], index) => { const a = positions(from); const b = positions(to); return <path key={`${from}-${to}-${index}`} d={`M ${a.x + 300} ${a.y + 120} C ${a.x + 390} ${a.y + 120}, ${b.x - 90} ${b.y + 120}, ${b.x} ${b.y + 120}`} fill="none" stroke="#716184" strokeWidth="2" markerEnd="url(#arrow)" />; })}</svg>
            <article className="workflow-node idea-node" style={{ left: positions("idea").x, top: positions("idea").y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, "idea")}><span className="node-type-icon">✎</span><div><small>INPUT · STORY</small><strong>故事创意</strong></div><span className="node-status">●</span></div><label className="node-field">创意描述<textarea value={selectedProject.idea} onChange={(event) => updateField("idea", event.target.value)} placeholder="写下故事灵感、角色或场景…" /></label><div className="node-footer"><span>输入节点</span><span className="socket socket-out" /></div></article>
            <article className="workflow-node script-node" style={{ left: positions("script").x, top: positions("script").y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, "script")}><span className="node-type-icon">▤</span><div><small>WORKFLOW · SCRIPT</small><strong>剧本创作</strong></div><span className="node-status">编辑</span></div><label className="node-field">剧本内容<textarea value={selectedProject.result.script} onChange={(event) => updateResultField("script", event.target.value)} placeholder="直接在这里写剧本；也可以点击上方按钮尝试 AI 生成。" /></label><div className="node-footer"><span>可手动编辑 · 无需 API</span><span className="socket socket-in" /><span className="socket socket-out" /></div></article>
            {shots.map((shot, index) => { const id = `shot-${index}`; const point = shot.canvasX !== undefined && !selectedProject.positions?.[id] ? { x: shot.canvasX, y: shot.canvasY ?? 145 } : positions(id); return <article className="workflow-node shot-node" key={`${shot.scene}-${index}`} style={{ left: point.x, top: point.y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, id)}><span className="node-type-icon">▧</span><div><small>WORKFLOW · SHOT {String(index + 1).padStart(2, "0")}</small><strong>分镜画面</strong></div><button className="node-delete" onClick={() => removeShot(index)} aria-label="删除分镜">×</button></div><label className="node-field">镜头名称<input value={shot.scene} onChange={(event) => updateShot(index, "scene", event.target.value)} /></label><label className="node-field">画面描述<textarea value={shot.visual} onChange={(event) => updateShot(index, "visual", event.target.value)} placeholder="描述这一镜的画面…" /></label><div className="node-row"><label className="node-field">景别<input value={shot.camera} onChange={(event) => updateShot(index, "camera", event.target.value)} /></label><label className="node-field">对白<input value={shot.dialogue} onChange={(event) => updateShot(index, "dialogue", event.target.value)} placeholder="对白 / 旁白" /></label></div><label className="node-field">绘图提示词<textarea value={shot.imagePrompt} onChange={(event) => updateShot(index, "imagePrompt", event.target.value)} placeholder="可手动填写提示词…" /></label><div className="node-footer"><span>分镜节点</span><span className="socket socket-in" /><span className="socket socket-out" /></div></article>; })}
            {media.map((item) => { const id = `media-${item.id}`; const point = positions(id); const url = mediaUrls[item.id]; return <article className="workflow-node media-node" key={item.id} style={{ left: point.x, top: point.y, width: 320 }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, id)}><span className="node-type-icon">{item.kind === "image" ? "▧" : "▶"}</span><div><small>LOCAL MEDIA · {item.kind.toUpperCase()}</small><strong title={item.name}>{item.name}</strong></div><button className="node-delete" onClick={() => void removeMedia(item)} aria-label="移除素材节点">×</button></div>{url ? item.kind === "image" ? <img src={url} alt={item.name} className="media-preview" /> : <video src={url} className="media-preview" controls preload="metadata" /> : <div className="media-missing">素材暂不可用，请重新导入文件</div>}<div className="node-footer"><span>本地浏览器存储 · 不上传服务器</span></div></article>; })}
            <article className="workflow-node export-node" style={{ left: positions("export").x, top: positions("export").y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, "export")}><span className="node-type-icon">⇩</span><div><small>OUTPUT</small><strong>项目结果</strong></div><span className="node-status">本地</span></div><label className="node-field">配音文案<textarea value={selectedProject.result.voiceover} onChange={(event) => updateResultField("voiceover", event.target.value)} placeholder="在此整理配音文案…" /></label><label className="node-field">视频提示词<textarea value={selectedProject.result.videoPrompt} onChange={(event) => updateResultField("videoPrompt", event.target.value)} placeholder="在此整理视频风格和镜头提示词…" /></label><button className="export-button" onClick={() => { const blob = new Blob([JSON.stringify(selectedProject, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${selectedProject.title || selectedProject.name}.json`; link.click(); URL.revokeObjectURL(url); }}>导出项目 JSON</button><div className="node-footer"><span>输出节点 · 本地导出</span><span className="socket socket-in" /></div></article>
            {!shots.length && !media.length && <div className="canvas-empty-note" style={{ left: 850, top: 560 }}>点击“添加分镜”或导入图片、视频素材</div>}
          </div></div>
        </section>
        <section className="panel lower-panel"><div className="workflow-steps">{workflowSteps.map((step, index) => <span className={`step-pill ${index === 0 || shots.length ? "active" : ""}`} key={step}><b>{String(index + 1).padStart(2, "0")}</b>{step}</span>)}</div><div className="lower-grid"><label className="field-group">一句话故事简介<textarea className="text-input lower-textarea" value={selectedProject.result.logline} onChange={(event) => updateResultField("logline", event.target.value)} placeholder="可以手动整理故事简介" /></label><div className="local-note"><strong>画布可独立使用</strong><p>项目与媒体文件保存在当前浏览器。图片和视频只在本机本地使用，不上传服务器；清理浏览器数据会移除这些文件。AI 生成是可选功能。</p></div></div></section>
      </section>
      <aside className="guide-panel panel"><p className="eyebrow">WORKFLOW GUIDE</p><h2>今天一起创作点什么？</h2><p className="guide-copy">把灵感拆成可编辑节点，按自己的节奏整理创作流程。</p><button className="guide-action" onClick={() => document.querySelector<HTMLTextAreaElement>(".idea-node textarea")?.focus()}><span>✧</span><div><strong>描述故事创意</strong><small>从想法开始，直接在画布里编辑</small></div></button><button className="guide-action" onClick={addShot}><span>▧</span><div><strong>添加分镜节点</strong><small>每个镜头都可以独立编辑和移动</small></div></button><button className="guide-action" onClick={() => imageInputRef.current?.click()}><span>▧</span><div><strong>导入本地图片</strong><small>将图片素材添加为可拖动节点</small></div></button><button className="guide-action" onClick={() => videoInputRef.current?.click()}><span>▶</span><div><strong>导入本地视频</strong><small>视频在画布节点中可直接预览播放</small></div></button><button className="guide-action" onClick={() => void generatePlan()} disabled={loading}><span>✦</span><div><strong>尝试 AI 生成方案</strong><small>可选功能，需要先配置服务端 API</small></div></button><div className="guide-tip"><strong>无需 API 即可使用</strong><p>本地导入的媒体通过浏览器 IndexedDB 保存，项目自动保存素材节点信息。素材不会上传到服务器。</p></div></aside>
    </div>
  </main>;
}
