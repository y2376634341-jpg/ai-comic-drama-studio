import { deleteProject, getProjectById, updateProject } from "@/lib/project-store";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) {
    return Response.json({ error: "项目不存在" }, { status: 404 });
  }
  return Response.json(project);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const updated = await updateProject(params.id, body);
    if (!updated) {
      return Response.json({ error: "项目不存在" }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    console.error("更新项目失败:", error);
    return Response.json({ error: "更新项目失败" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const deleted = await deleteProject(params.id);
  if (!deleted) {
    return Response.json({ error: "项目不存在" }, { status: 404 });
  }
  return Response.json({ success: true });
}
