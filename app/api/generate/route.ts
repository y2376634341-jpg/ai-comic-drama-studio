import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "服务端尚未配置 OpenAI API Key。" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { idea, genre, duration } = body;

    if (typeof idea !== "string" || !idea.trim()) {
      return Response.json({ error: "请先填写故事创意。" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是一位专业的漫剧编剧和分镜师。根据用户创意生成简体中文 JSON 结构，确保剧情、角色和镜头一致。不要添加 Markdown。",
        },
        {
          role: "user",
          content: `请根据以下信息生成一集漫剧制作方案：
故事创意：${idea}
题材：${genre}
目标时长：${duration}分钟

输出 JSON：
{
  "title": "剧名",
  "logline": "一句话故事简介",
  "characters": [
    { "name": "角色名", "description": "外形、性格和身份" }
  ],
  "script": "完整剧本，包含场景、动作与对白",
  "storyboard": [
    {
      "scene": "镜头序号和场景",
      "visual": "画面内容",
      "camera": "景别或运镜",
      "dialogue": "对白或旁白",
      "imagePrompt": "适用于 AI 绘图的画面提示词"
    }
  ],
  "voiceover": "配音文案",
  "videoPrompt": "适用于 AI 视频生成的整体风格和镜头提示词"
}

请生成 4 到 6 个分镜。`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "AI 暂时没有返回结果。" }, { status: 502 });
    }

    return Response.json(JSON.parse(content));
  } catch (error) {
    console.error("生成失败:", error);
    return Response.json(
      { error: "生成失败，请检查 OpenAI API 配置或稍后再试。" },
      { status: 500 },
    );
  }
}
