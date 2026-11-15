import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type StoryboardShot = {
  scene: string;
  visual: string;
  camera: string;
  dialogue: string;
  imagePrompt: string;
  canvasX?: number;
  canvasY?: number;
};

export type GenerationResult = {
  title: string;
  logline: string;
  characters: { name: string; description: string }[];
  script: string;
  storyboard: StoryboardShot[];
  voiceover: string;
  videoPrompt: string;
};

export type ProjectRecord = {
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

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");

function emptyResult(): GenerationResult {
  return {
    title: "",
    logline: "",
    characters: [],
    script: "",
    storyboard: [],
    voiceover: "",
    videoPrompt: "",
  };
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readProjects(): Promise<ProjectRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProjectRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeProjects(projects: ProjectRecord[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), "utf8");
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return readProjects();
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const projects = await readProjects();
  return projects.find((project) => project.id === id) || null;
}

export async function createProject(input: Partial<ProjectRecord>): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const project: ProjectRecord = {
    id: crypto.randomUUID(),
    name: input.name || "未命名漫剧项目",
    title: input.title || "未命名漫剧",
    idea: input.idea || "",
    genre: input.genre || "奇幻",
    duration: Number(input.duration) || 3,
    shotCount: Number(input.shotCount) || 5,
    result: input.result || emptyResult(),
    createdAt: now,
    updatedAt: now,
  };

  const projects = await readProjects();
  projects.unshift(project);
  await writeProjects(projects);
  return project;
}

export async function updateProject(id: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
  const projects = await readProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) return null;

  const next: ProjectRecord = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  projects[index] = next;
  await writeProjects(projects);
  return next;
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await readProjects();
  const next = projects.filter((project) => project.id !== id);
  if (next.length === projects.length) return false;
  await writeProjects(next);
  return true;
}
