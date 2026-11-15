"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StoryboardShot = {
  scene: string;
  visual: string;
  camera: string;
  dialogue: string;
  imagePrompt: string;
  canvasX?: number;
  canvasY?: number;
};

type GenerationResult = {
  title: string;
  logline: string;
  characters: { name: string; description: string }[];
  script: string;
  storyboard: StoryboardShot[];
  voiceover: string;
  videoPrompt: string;
};

type ProjectRecord = {
  id: string;
  name: string;
  title: string;
  idea: string;
  genre: string;
  duration: number;
  shotCount: number;
  result: GenerationResult;
  createdAt: string;
  updatedAt: string;
};

type CanvasGesture =
  | { kind: "pan"; pointerX: number; pointerY: number; originX: number; originY: number }
  | { kind: "node"; index: number; pointerX: number; pointerY: number; originX: number; originY: number }
  | null;

const workflowSteps = ["故事设定", "剧本创作", "分镜设计", "配音文案", "生成提示词"];
const seedIdea = "失去记忆的少女在废弃都市中醒来，发现自己能听见古老机械的心跳，而一台失落的战争机器正试图带她找到自己真正的过去。";
const emptyResult: GenerationResult = { title: "", logline: "", characters: [], script: "", storyboard: [], voiceover: "", videoPrompt: "" };
const defaultNodePosition = (index: number) => ({ x: 80 + (index % 3) * 370, y: 80 + Math.floor(index / 3) * 330 });

export default function Home() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const gesture = useRef<CanvasGesture>(null);
  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedId) || null, [projects, selectedId]);

  async function loadProjects() {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length) setSelectedId(data[0].id);
    } catch {
      setError("无法加载项目列表");
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  async function createProject() {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "未命名漫剧项目", title: "新漫剧项目", idea: seedIdea, genre: "奇幻", duration: 3, shotCount: 5, result: emptyResult }),
      });
      const project = await response.json();
      if (!response.ok) throw new Error(project.error || "创建项目失败");
      setProjects((previous) => [project, ...previous]);
      setSelectedId(project.id);
      setView({ x: 0, y: 0, scale: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建项目失败");
    }
  }

  async function saveProject() {
    if (!selectedProject) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedProject),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      setProjects((previous) => previous.map((project) => project.id === data.id ? data : project));
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selectedProject) return;
    const response = await fetch(`/api/projects/${selectedProject.id}`, { method: "DELETE" });
    if (response.ok) {
      const remaining = projects.filter((project) => project.id !== selectedProject.id);
      setProjects(remaining);
      setSelectedId(remaining[0]?.id || null);
      setError("");
    }
  }

  async function generateProject() {
    if (!selectedProject) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: selectedProject.idea, genre: selectedProject.genre, duration: selectedProject.duration, shotCount: selectedProject.shotCount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败");
      const project: ProjectRecord = {
        ...selectedProject,
        title: data.title || selectedProject.title,
        result: {
          title: data.title || selectedProject.title,
          logline: data.logline || "",
          characters: Array.isArray(data.characters) ? data.characters : [],
          script: data.script || "",
          storyboard: Array.isArray(data.storyboard) ? data.storyboard : [],
          voiceover: data.voiceover || "",
          videoPrompt: data.videoPrompt || "",
        },
        updatedAt: new Date().toISOString(),
      };
      setProjects((previous) => previous.map((item) => item.id === project.id ? project : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  function updateProjectField<K extends keyof ProjectRecord>(key: K, value: ProjectRecord[K]) {
    if (!selectedProject) return;
    setProjects((previous) => previous.map((project) => project.id === selectedProject.id ? { ...project, [key]: value, updatedAt: new Date().toISOString() } : project));
  }

  function updateResultField<K extends keyof GenerationResult>(field: K, value: GenerationResult[K]) {
    if (!selectedProject) return;
    setProjects((previous) => previous.map((project) => project.id === selectedProject.id
      ? { ...project, result: { ...project.result, [field]: value }, updatedAt: new Date().toISOString() }
      : project));
  }

  function updateShot(index: number, field: keyof StoryboardShot, value: string | number) {
    if (!selectedProject) return;
    const shots = [...selectedProject.result.storyboard];
    shots[index] = { ...shots[index], [field]: value };
    updateResultField("storyboard", shots);
  }

  function addShot() {
    if (!selectedProject) return;
    const index = selectedProject.result.storyboard.length;
    const position = defaultNodePosition(index);
    updateResultField("storyboard", [...selectedProject.result.storyboard, {
      scene: `新分镜 ${index + 1}`, visual: "", camera: "中景", dialogue: "", imagePrompt: "", canvasX: position.x, canvasY: position.y,
    }]);
  }

  function removeShot(index: number) {
    if (!selectedProject) return;
    updateResultField("storyboard", selectedProject.result.storyboard.filter((_, shotIndex) => shotIndex !== index));
  }

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".canvas-node, .canvas-toolbar, button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { kind: "pan", pointerX: event.clientX, pointerY: event.clientY, originX: view.x, originY: view.y };
  }

  function startNodeDrag(event: React.PointerEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const shot = selectedProject?.result.storyboard[index];
    if (!shot) return;
    const position = defaultNodePosition(index);
    gesture.current = { kind: "node", index, pointerX: event.clientX, pointerY: event.clientY, originX: shot.canvasX ?? position.x, originY: shot.canvasY ?? position.y };
  }

  function moveCanvas(event: React.PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current) return;
    const dx = event.clientX - current.pointerX;
    const dy = event.clientY - current.pointerY;
    if (current.kind === "pan") setView((previous) => ({ ...previous, x: current.originX + dx, y: current.originY + dy }));
    else {
      updateShot(current.index, "canvasX", current.originX + dx / view.scale);
      updateShot(current.index, "canvasY", current.originY + dy / view.scale);
    }
  }

  function zoomCanvas(amount: number) {
    setView((previous) => ({ ...previous, scale: Math.min(2, Math.max(0.35, previous.scale + amount)) }));
  }

  function exportProject() {
    if (!selectedProject) return;
    const blob = new Blob([JSON.stringify(selectedProject, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(selectedProject.title || selectedProject.name).replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!selectedProject) return (
    <main className="empty-landing">
      <span className="brand-mark">✦</span>
      <p className="eyebrow">AI COMIC STUDIO</p>
      <h1>漫剧工作流平台</h1>
      <p>创建第一个项目，开始你的 AI 制作流水线。</p>
      <button className="primary-button" onClick={() => void createProject()}>新建项目</button>
      {error && <p className="error-box">{error}</p>}
    </main>
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><div><p className="eyebrow">AI COMIC STUDIO</p><h1>漫剧工作流平台</h1></div></div>
        <div className="header-actions">
          <button className="secondary-button" onClick={() => void createProject()}>＋ 新项目</button>
          <button className="secondary-button" onClick={() => void saveProject()} disabled={saving}>{saving ? "保存中…" : "保存"}</button>
          <button className="secondary-button" onClick={exportProject}>导出 JSON</button>
          <button className="secondary-button danger" onClick={() => void deleteSelected()}>删除项目</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar panel">
          <div className="sidebar-header"><h2>项目列表</h2><button className="icon-button" onClick={() => void createProject()} aria-label="新建项目">＋</button></div>
          <div className="project-list">{projects.map((project) => (
            <button key={project.id} className={`project-item ${selectedProject.id === project.id ? "selected" : ""}`} onClick={() => { setSelectedId(project.id); setView({ x: 0, y: 0, scale: 1 }); }}>
              <strong>{project.name || project.title}</strong><span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : "新项目"}</span>
            </button>
          ))}</div>
          <div className="sidebar-hint">拖动空白处平移画布<br />滚轮缩放，拖动分镜卡片调整位置</div>
        </aside>

        <section className="main-column">
          <section className="panel project-settings">
            <div className="section-heading"><div><p className="eyebrow">PROJECT SETUP</p><h2>故事设定</h2></div><button className="primary-button generate-button" onClick={() => void generateProject()} disabled={loading || !selectedProject.idea.trim()}>{loading ? "生成中…" : "✦ 生成漫剧方案"}</button></div>
            <div className="settings-grid">
              <label className="field-group">项目名称<input className="text-input" value={selectedProject.name} onChange={(event) => updateProjectField("name", event.target.value)} /></label>
              <label className="field-group">作品标题<input className="text-input" value={selectedProject.title} onChange={(event) => updateProjectField("title", event.target.value)} /></label>
              <label className="field-group">题材<select className="select-box" value={selectedProject.genre} onChange={(event) => updateProjectField("genre", event.target.value)}>{"奇幻,都市,科幻,悬疑,恋爱,热血".split(",").map((genre) => <option key={genre}>{genre}</option>)}</select></label>
              <label className="field-group">时长<select className="select-box" value={selectedProject.duration} onChange={(event) => updateProjectField("duration", Number(event.target.value))}>{[1, 3, 5, 8, 10, 15].map((duration) => <option key={duration} value={duration}>{duration} 分钟</option>)}</select></label>
              <label className="field-group">分镜数量 <span className="range-value">{selectedProject.shotCount}</span><input type="range" min={3} max={8} value={selectedProject.shotCount} onChange={(event) => updateProjectField("shotCount", Number(event.target.value))} /></label>
              <label className="field-group idea-field">故事创意<textarea className="text-input idea-textarea" value={selectedProject.idea} onChange={(event) => updateProjectField("idea", event.target.value)} /></label>
            </div>
            {error && <p className="error-box">{error}</p>}
          </section>

          <section className="panel output-panel">
            <div className="workflow-steps">{workflowSteps.map((step, index) => <span className={`step-pill ${selectedProject.result.title ? "active" : ""}`} key={step}><b>{String(index + 1).padStart(2, "0")}</b>{step}</span>)}</div>
            {!selectedProject.result.title && !loading && <div className="empty-state"><span>✦</span><h2>准备好开始创作了吗？</h2><p>填写故事创意并生成方案，分镜将出现在无限画布上。</p></div>}
            {loading && <div className="empty-state"><span className="spinner">✦</span><p>AI 正在生成完整漫剧方案…</p></div>}
            {selectedProject.result.title && <div className="result-content">
              <div className="result-header"><div><p className="eyebrow">PROJECT STORY</p><h2>{selectedProject.result.title}</h2><p>{selectedProject.result.logline}</p></div></div>
              <section className="section-block"><div className="section-heading"><div><p className="eyebrow">STORYBOARD</p><h3>分镜无限画布</h3></div><span className="canvas-help">拖拽空白区域平移 · 滚轮缩放 · 拖动卡片移动</span></div>
                <div className="canvas-toolbar"><button className="canvas-action" onClick={addShot}>＋ 添加分镜</button><span className="toolbar-spacer"/><button className="canvas-action" onClick={() => zoomCanvas(-0.15)} aria-label="缩小">−</button><span className="zoom-label">{Math.round(view.scale * 100)}%</span><button className="canvas-action" onClick={() => zoomCanvas(0.15)} aria-label="放大">＋</button><button className="canvas-action" onClick={() => setView({ x: 0, y: 0, scale: 1 })}>重置视图</button></div>
                <div className="canvas-viewport" onPointerDown={startPan} onPointerMove={moveCanvas} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onWheel={(event) => { event.preventDefault(); zoomCanvas(event.deltaY < 0 ? 0.08 : -0.08); }}>
                  <div className="canvas-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
                    {selectedProject.result.storyboard.map((shot, index) => {
                      const fallback = defaultNodePosition(index);
                      return <article className="canvas-node" key={`${shot.scene}-${index}`} style={{ left: shot.canvasX ?? fallback.x, top: shot.canvasY ?? fallback.y }}>
                        <div className="node-header" onPointerDown={(event) => startNodeDrag(event, index)}><span className="node-grip">⠿</span><input aria-label="分镜名称" value={shot.scene} onChange={(event) => updateShot(index, "scene", event.target.value)} onPointerDown={(event) => event.stopPropagation()} /><button className="node-delete" onClick={() => removeShot(index)} aria-label="删除分镜">×</button></div>
                        <label className="node-field">画面描述<textarea value={shot.visual} onChange={(event) => updateShot(index, "visual", event.target.value)} placeholder="描述这一镜的画面…" /></label>
                        <div className="node-row"><label className="node-field">景别<input value={shot.camera || "中景"} onChange={(event) => updateShot(index, "camera", event.target.value)} /></label><label className="node-field">对白<input value={shot.dialogue} onChange={(event) => updateShot(index, "dialogue", event.target.value)} placeholder="对白 / 旁白" /></label></div>
                        <label className="node-field">AI 绘图提示词<textarea className="prompt-input" value={shot.imagePrompt} onChange={(event) => updateShot(index, "imagePrompt", event.target.value)} placeholder="绘图提示词…" /></label>
                      </article>;
                    })}
                    {!selectedProject.result.storyboard.length && <div className="canvas-empty-note">还没有分镜，点击“添加分镜”开始构建画面。</div>}
                  </div>
                </div>
              </section>
              <div className="below-grid">
                <section className="section-block"><p className="eyebrow">CHARACTERS</p><h3>角色设定</h3><div className="character-grid">{selectedProject.result.characters.map((character, index) => <article className="mini-card" key={`${character.name}-${index}`}><strong>{character.name}</strong><p>{character.description}</p></article>)}</div></section>
                <section className="section-block"><p className="eyebrow">SCRIPT</p><h3>完整脚本</h3><textarea className="long-textarea" value={selectedProject.result.script} onChange={(event) => updateResultField("script", event.target.value)} /></section>
                <section className="section-block"><p className="eyebrow">VOICEOVER</p><h3>配音文案</h3><textarea className="long-textarea" value={selectedProject.result.voiceover} onChange={(event) => updateResultField("voiceover", event.target.value)} /></section>
                <section className="section-block"><p className="eyebrow">VIDEO PROMPT</p><h3>视频生成提示词</h3><textarea className="long-textarea" value={selectedProject.result.videoPrompt} onChange={(event) => updateResultField("videoPrompt", event.target.value)} /></section>
              </div>
            </div>}
          </section>
        </section>
      </div>
    </main>
  );
}
