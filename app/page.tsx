import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function normalizeInt(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(Math.round(numeric), min), max);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "未配置 OPENAI_API_KEY，请先在 .env.local 中填写有效的 OpenAI API Key。" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    const genre = typeof body.genre === "string" && body.genre.trim() ? body.genre.trim() : "奇幻";
    const duration = normalizeInt(body.duration, 3, 1, 15);
    const shotCount = normalizeInt(body.shotCount, 5, 3, 8);

    if (!idea) {
      return Response.json({ error: "请先填写故事创意。" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是一位资深的漫剧编剧、分镜师和影视制片人。根据用户创意，产出简体中文 JSON，确保故事完整、角色一致、镜头清晰、适合 AI 生成图片和视频。严格输出 JSON，不要附带解释、Markdown 或注释。",
        },
        {
          role: "user",
          content: `请根据以下信息生成一集漫剧制作方案：
故事创意：${idea}
题材：${genre}
目标时长：${duration}分钟
镜头数量目标：${shotCount}个分镜

输出 JSON，结构如下：
{
  "title": "剧名",
  "logline": "一句话故事简介",
  "characters": [
    { "name": "角色名", "description": "角色设定：外形、性格、身份、动机" }
  ],
  "script": "完整剧本，包含场景、动作和对白",
  "storyboard": [
    {
      "scene": "镜头编号和场景",
      "visual": "画面内容",
      "camera": "镜头景别和运镜方式",
      "dialogue": "对白、旁白或音效提示",
      "imagePrompt": "适合 AI 绘图的详细提示词"
    }
  ],
  "voiceover": "配音文案",
  "videoPrompt": "适合 AI 视频生成的整体风格和镜头提示词"
}

要求：
1. 角色和剧情前后一致。
2. 分镜数量控制在 ${shotCount} 个左右。
3. 画面风格要适配 ${genre} 题材。
4. 适用于动漫/漫画风格短片制作。`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI 暂时没有返回结果，请稍后重试。" }, { status: 502 });
    }

    const parsed = JSON.parse(content);

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.logline !== "string" ||
      !Array.isArray(parsed.characters) ||
      !Array.isArray(parsed.storyboard)
    ) {
      return Response.json({ error: "AI 返回的数据结构不符合预期，请重试。" }, { status: 502 });
    }

    return Response.json({
      title: parsed.title,
      logline: parsed.logline,
      characters: parsed.characters,
      script: parsed.script || "",
      storyboard: parsed.storyboard.map((shot: any, index: number) => ({
        scene: shot.scene || `镜头 ${index + 1}`,
        visual: shot.visual || "",
        camera: shot.camera || "中景",
        dialogue: shot.dialogue || "",
        imagePrompt: shot.imagePrompt || "",
      })),
      voiceover: parsed.voiceover || "",
      videoPrompt: parsed.videoPrompt || "",
    });
  } catch (error) {
    console.error("生成漫剧方案失败:", error);
    return Response.json(
      { error: "生成失败，请检查 OpenAI API 配置、账号权限或网络状态，然后重试。" },
      { status: 500 }
    );
  }
}
