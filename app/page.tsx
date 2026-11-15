"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type StoryboardShot = { scene: string; visual: string; camera: string; dialogue: string; imagePrompt: string; canvasX?: number; canvasY?: number };
type GenerationResult = { title: string; logline: string; characters: { name: string; description: string }[]; script: string; storyboard: StoryboardShot[]; voiceover: string; videoPrompt: string };
type Point = { x: number; y: number };
type ProjectRecord = { id: string; name: string; title: string; idea: string; genre: string; duration: number; shotCount: number; result: GenerationResult; positions: Record<string, Point>; createdAt: string; updatedAt: string };
type Viewport = { x: number; y: number; scale: number };
type Gesture = { kind: "pan"; pointerX: number; pointerY: number; originX: number; originY: number } | { kind: "node"; id: string; pointerX: number; pointerY: number; originX: number; originY: number } | null;

const STORAGE_KEY = "ai-comic-studio-projects-v2";
const workflowSteps = ["故事设定", "剧本创作", "分镜设计", "配音文案", "生成提示词"];
const emptyResult = (): GenerationResult => ({ title: "", logline: "", characters: [], script: "", storyboard: [], voiceover: "", videoPrompt: "" });
const initialPositions: Record<string, Point> = { idea: { x: 70, y: 170 }, script: { x: 440, y: 170 }, export: { x: 1660, y: 170 } };

function makeProject(name = "未命名漫剧项目"): ProjectRecord {
  const now = new Date().toISOString();
  return { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, title: "新漫剧项目", idea: "", genre: "奇幻", duration: 3, shotCount: 5, result: emptyResult(), positions: { ...initialPositions }, createdAt: now, updatedAt: now };
}
const firstProject: ProjectRecord = { id: "local-welcome-project", name: "我的第一个项目", title: "新漫剧项目", idea: "在这里写下你的故事创意。你可以先搭建工作流、添加分镜并编辑内容，不需要配置 AI API。", genre: "奇幻", duration: 3, shotCount: 5, result: emptyResult(), positions: { ...initialPositions }, createdAt: "", updatedAt: "" };
const nodePosition = (project: ProjectRecord, id: string): Point => project.positions?.[id] || (id.startsWith("shot-") ? { x: 850 + (Number(id.slice(5)) % 2) * 350, y: 145 + Math.floor(Number(id.slice(5)) / 2) * 350 } : initialPositions[id] || { x: 70, y: 170 });

export default function Home() {
  const [projects, setProjects] = useState<ProjectRecord[]>([firstProject]);
  const [selectedId, setSelectedId] = useState(firstProject.id);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [view, setView] = useState<Viewport>({ x: 0, y: 0, scale: 0.82 });
  const gesture = useRef<Gesture>(null);
  const canvasPanelRef = useRef<HTMLElement>(null);
  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedId) || projects[0] || null, [projects, selectedId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) { setProjects(parsed as ProjectRecord[]); setSelectedId((parsed as ProjectRecord[])[0].id); }
      }
    } catch { /* Use the starter project if local storage is unavailable or invalid. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); }
    catch { setError("浏览器无法保存本地项目，请检查存储空间或隐私设置。"); }
  }, [projects, ready]);
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
  function addShot() {
    if (!selectedProject) return;
    const index = selectedProject.result.storyboard.length;
    const point = { x: 850 + (index % 2) * 350, y: 145 + Math.floor(index / 2) * 350 };
    updateSelected((project) => ({ ...project, result: { ...project.result, storyboard: [...project.result.storyboard, { scene: `新分镜 ${index + 1}`, visual: "", camera: "中景", dialogue: "", imagePrompt: "", canvasX: point.x, canvasY: point.y }] } }));
  }
  function updateShot(index: number, field: keyof StoryboardShot, value: string | number) {
    updateSelected((project) => { const storyboard = [...project.result.storyboard]; storyboard[index] = { ...storyboard[index], [field]: value }; return { ...project, result: { ...project.result, storyboard } }; });
  }
  function removeShot(index: number) {
    updateSelected((project) => ({ ...project, result: { ...project.result, storyboard: project.result.storyboard.filter((_, itemIndex) => itemIndex !== index) } }));
  }
  async function toggleFullscreen() {
    const element = canvasPanelRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch { setError("浏览器无法进入全屏模式；请尝试使用浏览器的全屏快捷键。"); }
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
  const positions = (id: string) => nodePosition(selectedProject, id);
  const edges = [["idea", "script"], ...(shots.length ? [["script", "shot-0"]] : [["script", "export"]]), ...shots.slice(0, -1).map((_, index) => [`shot-${index}`, `shot-${index + 1}`]), ...(shots.length ? [[`shot-${shots.length - 1}`, "export"]] : [])];

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">✦</span><div><p className="eyebrow">AI COMIC STUDIO</p><h1>漫剧工作流画布</h1></div></div><div className="header-actions"><span className="local-badge"><i /> 本地自动保存 · 无需 AI API</span><button className="secondary-button" onClick={createProject}>＋ 新建项目</button><button className="secondary-button danger" onClick={deleteProject}>删除项目</button></div></header>
    <div className="workspace">
      <aside className="sidebar panel"><div className="sidebar-header"><h2>项目列表</h2><button className="icon-button" onClick={createProject} aria-label="新建项目">＋</button></div><div className="project-list">{projects.map((project) => <button key={project.id} className={`project-item ${project.id === selectedProject.id ? "selected" : ""}`} onClick={() => { setSelectedId(project.id); setError(""); }}><strong>{project.name || project.title}</strong><span>{project.updatedAt ? project.updatedAt.slice(0, 10) : "本地项目"}</span></button>)}</div><div className="sidebar-hint">拖动空白处平移画布<br />滚轮缩放 · 拖动节点调整位置<br />内容自动保存在当前浏览器</div></aside>
      <section className="main-column">
        <section className="panel project-settings"><div className="section-heading"><div><p className="eyebrow">PROJECT SETUP</p><h2>故事设定</h2></div><button className="primary-button generate-button" onClick={() => void generatePlan()} disabled={loading}>{loading ? "生成中…" : "✦ 使用 AI 生成方案（可选）"}</button></div><div className="settings-grid"><label className="field-group">项目名称<input className="text-input" value={selectedProject.name} onChange={(event) => updateField("name", event.target.value)} /></label><label className="field-group">作品标题<input className="text-input" value={selectedProject.title} onChange={(event) => updateField("title", event.target.value)} /></label><label className="field-group">题材<select className="select-box" value={selectedProject.genre} onChange={(event) => updateField("genre", event.target.value)}>{"奇幻,都市,科幻,悬疑,恋爱,热血".split(",").map((genre) => <option key={genre}>{genre}</option>)}</select></label><label className="field-group">时长<select className="select-box" value={selectedProject.duration} onChange={(event) => updateField("duration", Number(event.target.value))}>{[1, 3, 5, 8, 10, 15].map((duration) => <option key={duration} value={duration}>{duration} 分钟</option>)}</select></label><label className="field-group shot-count-field">分镜数量 <span className="range-value">{selectedProject.shotCount}</span><input type="range" min={3} max={8} value={selectedProject.shotCount} onChange={(event) => updateField("shotCount", Number(event.target.value))} /></label></div>{error && <p className="error-box">{error}</p>}</section>
        <section ref={canvasPanelRef} className={`panel canvas-panel${isCanvasFullscreen ? " canvas-panel-fullscreen" : ""}`}><div className="canvas-heading"><div><p className="eyebrow">VISUAL WORKFLOW</p><h2>无限工作流画布</h2><p>先搭建和编辑节点；AI 生成是可选功能。</p></div><div className="canvas-toolbar"><button className="canvas-action" onClick={addShot}>＋ 添加分镜节点</button><button className="canvas-action" onClick={() => zoomCanvas(-0.12)} aria-label="缩小">−</button><span className="zoom-label">{Math.round(view.scale * 100)}%</span><button className="canvas-action" onClick={() => zoomCanvas(0.12)} aria-label="放大">＋</button><button className="canvas-action" onClick={() => setView({ x: 0, y: 0, scale: 0.82 })}>重置视图</button><button className="canvas-action fullscreen-action" onClick={() => void toggleFullscreen()} aria-label={isCanvasFullscreen ? "退出全屏" : "进入全屏"}>{isCanvasFullscreen ? "⤢ 退出全屏" : "⛶ 全屏"}</button></div></div>
          <div className="workflow-legend"><span><i className="legend-dot idea-dot" />输入节点</span><span><i className="legend-dot process-dot" />创作节点</span><span><i className="legend-dot output-dot" />输出节点</span><span className="legend-help">拖拽节点和画布，滚轮缩放 · 按 Esc 退出全屏</span></div>
          <div className="canvas-viewport" onPointerDown={startPan} onPointerMove={moveCanvas} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onWheel={(event) => { event.preventDefault(); zoomCanvas(event.deltaY < 0 ? 0.06 : -0.06); }}><div className="canvas-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            <svg className="connection-layer" width="5000" height="3000" aria-hidden="true"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#8b7ba9" /></marker></defs>{edges.map(([from, to], index) => { const a = positions(from); const b = positions(to); return <path key={`${from}-${to}-${index}`} d={`M ${a.x + 300} ${a.y + 120} C ${a.x + 390} ${a.y + 120}, ${b.x - 90} ${b.y + 120}, ${b.x} ${b.y + 120}`} fill="none" stroke="#716184" strokeWidth="2" markerEnd="url(#arrow)" />; })}</svg>
            <article className="workflow-node idea-node" style={{ left: positions("idea").x, top: positions("idea").y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, "idea")}><span className="node-type-icon">✎</span><div><small>INPUT · STORY</small><strong>故事创意</strong></div><span className="node-status">●</span></div><label className="node-field">创意描述<textarea value={selectedProject.idea} onChange={(event) => updateField("idea", event.target.value)} placeholder="写下故事灵感、角色或场景…" /></label><div className="node-footer"><span>输入节点</span><span className="socket socket-out" /></div></article>
            <article className="workflow-node script-node" style={{ left: positions("script").x, top: positions("script").y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, "script")}><span className="node-type-icon">▤</span><div><small>WORKFLOW · SCRIPT</small><strong>剧本创作</strong></div><span className="node-status">编辑</span></div><label className="node-field">剧本内容<textarea value={selectedProject.result.script} onChange={(event) => updateResultField("script", event.target.value)} placeholder="直接在这里写剧本；也可以点击上方按钮尝试 AI 生成。" /></label><div className="node-footer"><span>可手动编辑 · 无需 API</span><span className="socket socket-in" /><span className="socket socket-out" /></div></article>
            {shots.map((shot, index) => { const id = `shot-${index}`; const point = shot.canvasX !== undefined && !selectedProject.positions?.[id] ? { x: shot.canvasX, y: shot.canvasY ?? 145 } : positions(id); return <article className="workflow-node shot-node" key={`${shot.scene}-${index}`} style={{ left: point.x, top: point.y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, id)}><span className="node-type-icon">▧</span><div><small>WORKFLOW · SHOT {String(index + 1).padStart(2, "0")}</small><strong>分镜画面</strong></div><button className="node-delete" onClick={() => removeShot(index)} aria-label="删除���镜">×</button></div><label className="node-field">镜头名称<input value={shot.scene} onChange={(event) => updateShot(index, "scene", event.target.value)} /></label><label className="node-field">画面描述<textarea value={shot.visual} onChange={(event) => updateShot(index, "visual", event.target.value)} placeholder="描述这一镜的画面…" /></label><div className="node-row"><label className="node-field">景别<input value={shot.camera} onChange={(event) => updateShot(index, "camera", event.target.value)} /></label><label className="node-field">对白<input value={shot.dialogue} onChange={(event) => updateShot(index, "dialogue", event.target.value)} placeholder="对白 / 旁白" /></label></div><label className="node-field">绘图提示词<textarea value={shot.imagePrompt} onChange={(event) => updateShot(index, "imagePrompt", event.target.value)} placeholder="可手动填写提示词…" /></label><div className="node-footer"><span>分镜节点</span><span className="socket socket-in" /><span className="socket socket-out" /></div></article>; })}
            <article className="workflow-node export-node" style={{ left: positions("export").x, top: positions("export").y }}><div className="node-header" onPointerDown={(event) => startNodeDrag(event, "export")}><span className="node-type-icon">⇩</span><div><small>OUTPUT</small><strong>项目结果</strong></div><span className="node-status">本地</span></div><label className="node-field">配音文案<textarea value={selectedProject.result.voiceover} onChange={(event) => updateResultField("voiceover", event.target.value)} placeholder="在此整理配音文案…" /></label><label className="node-field">视频提示词<textarea value={selectedProject.result.videoPrompt} onChange={(event) => updateResultField("videoPrompt", event.target.value)} placeholder="在此整理视频风格和镜头提示词…" /></label><button className="export-button" onClick={() => { const blob = new Blob([JSON.stringify(selectedProject, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${selectedProject.title || selectedProject.name}.json`; link.click(); URL.revokeObjectURL(url); }}>导出项目 JSON</button><div className="node-footer"><span>输出节点 · 本地导出</span><span className="socket socket-in" /></div></article>
            {!shots.length && <div className="canvas-empty-note" style={{ left: 850, top: 560 }}>点击“添加分镜节点”开始搭建你的工作流</div>}
          </div></div>
        </section>
        <section className="panel lower-panel"><div className="workflow-steps">{workflowSteps.map((step, index) => <span className={`step-pill ${index === 0 || shots.length ? "active" : ""}`} key={step}><b>{String(index + 1).padStart(2, "0")}</b>{step}</span>)}</div><div className="lower-grid"><label className="field-group">一句话故事简介<textarea className="text-input lower-textarea" value={selectedProject.result.logline} onChange={(event) => updateResultField("logline", event.target.value)} placeholder="可以手动整理故事简介" /></label><div className="local-note"><strong>画布可独立使用</strong><p>创建项目、编辑剧本与分镜、拖动缩放画布、导出 JSON 都在本地完成。AI 生成需要另行配置兼容接口和 API Key。</p></div></div></section>
      </section>
      <aside className="guide-panel panel"><p className="eyebrow">WORKFLOW GUIDE</p><h2>今天一起创作点什么？</h2><p className="guide-copy">把灵感拆成可编辑节点，按自己的节奏整理创作流程。</p><button className="guide-action" onClick={() => document.querySelector<HTMLTextAreaElement>(".idea-node textarea")?.focus()}><span>✧</span><div><strong>描述故事创意</strong><small>从想法开始，直接在画布里编辑</small></div></button><button className="guide-action" onClick={addShot}><span>▧</span><div><strong>添加分镜节点</strong><small>每个镜头都可以独立编辑和移动</small></div></button><button className="guide-action" onClick={() => void generatePlan()} disabled={loading}><span>✦</span><div><strong>尝试 AI 生成方案</strong><small>可选功能，需要先配置服务端 API</small></div></button><div className="guide-tip"><strong>无需 API 即可使用</strong><p>节点内容自动保存在此浏览器。AI API 仅用于自动生成，不影响画布、手动编辑和项目导出。</p></div></aside>
    </div>
  </main>;
}
