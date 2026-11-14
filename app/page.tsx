"use client";

import { useState } from "react";

type StoryboardShot = {
  scene: string;
  visual: string;
  camera: string;
  dialogue: string;
  imagePrompt: string;
};

type WorkflowResult = {
  title: string;
  logline: string;
  characters: { name: string; description: string }[];
  script: string;
  storyboard: StoryboardShot[];
  voiceover: string;
  videoPrompt: string;
};

const workflowSteps = ["故事设定", "剧本创作", "分镜设计", "配音文案", "生成提示词"];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("奇幻");
  const [duration, setDuration] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);

  async function generate() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, genre, duration }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生未知错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="container">
        <header className="hero-block">
          <div className="eyebrow">COMIC FLOW · AI STUDIO</div>
          <h1>漫剧创作工作台</h1>
          <p>从一个创意开始，自动生成剧本、分镜、配音文案与 AI 制作提示词。</p>
        </header>

        <section className="workspace">
          <aside className="panel form-panel">
            <h2>新建漫剧项目</h2>

            <label className="field-label">故事创意</label>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="例如：失去记忆的少女在废土城市醒来，发现自己能听见古老机器的声音……"
              className="idea-input"
            />

            <div className="two-columns">
              <label className="field-label">
                题材
                <select
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  className="select-box"
                >
                  {[
                    "奇幻",
                    "都市",
                    "科幻",
                    "悬疑",
                    "恋爱",
                    "热血",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                时长（分钟）
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="select-box"
                >
                  {["1", "3", "5", "10"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="primary-button"
              onClick={generate}
              disabled={loading || !idea.trim()}
            >
              {loading ? "正在生成工作流…" : "✦ 生成漫剧方案"}
            </button>

            {error && <p className="error-text">{error}</p>}
          </aside>

          <section className="panel output-panel">
            <div className="step-row">
              {workflowSteps.map((step, index) => (
                <div key={step} className={`step-pill ${result ? "active" : ""}`}>
                  <span className="step-index">0{index + 1}</span>
                  {step}
                </div>
              ))}
            </div>

            {!result && !loading && (
              <div className="empty-state">
                <div className="empty-icon">✧</div>
                <p>填写左侧创意，开始你的漫剧制作流程</p>
              </div>
            )}

            {loading && <div className="loading-state">AI 正在整理故事、剧本和分镜…</div>}

            {result && (
              <div className="result-stack">
                <div className="result-header">
                  <p className="mini-label">项目方案</p>
                  <h2>{result.title}</h2>
                  <p className="logline">{result.logline}</p>
                </div>

                <div>
                  <h3>角色设定</h3>
                  <div className="card-grid">
                    {result.characters?.map((character, index) => (
                      <article key={index} className="content-card">
                        <div className="card-title">{character.name}</div>
                        <p>{character.description}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <h3>分镜设计</h3>
                  <div className="shot-list">
                    {result.storyboard?.map((shot, index) => (
                      <article key={index} className="shot-card">
                        <div className="shot-header">
                          <h4>{shot.scene || `镜头 ${index + 1}`}</h4>
                          <span>{shot.camera}</span>
                        </div>
                        <p>{shot.visual}</p>
                        {shot.dialogue && <p className="dialogue">对白：{shot.dialogue}</p>}
                        <p className="prompt-box">绘图提示词：{shot.imagePrompt}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <details className="details-panel">
                  <summary>查看完整剧本、配音和视频提示词</summary>
                  <h4>剧本</h4>
                  <pre>{result.script}</pre>
                  <h4>配音文案</h4>
                  <p>{result.voiceover}</p>
                  <h4>视频生成提示词</h4>
                  <p>{result.videoPrompt}</p>
                </details>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
