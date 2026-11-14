import { createProject, listProjects } from "@/lib/project-store";

export async function GET() {
  const projects = await listProjects();
  return Response.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const project = await createProject({
      name: typeof body.name === "string" ? body.name : "未命名漫剧项目",
      title: typeof body.title === "string" ? body.title : "未命名漫剧",
      idea: typeof body.idea === "string" ? body.idea : "",
      genre: typeof body.genre === "string" ? body.genre : "奇幻",
      duration: Number(body.duration) || 3,
      shotCount: Number(body.shotCount) || 5,
      result: body.result || {
        title: "",
        logline: "",
        characters: [],
        script: "",
        storyboard: [],
        voiceover: "",
        videoPrompt: "",
      },
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("创建项目失败:", error);
    return Response.json({ error: "创建项目失败" }, { status: 500 });
  }
}
