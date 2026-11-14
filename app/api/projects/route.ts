export type StoryboardShot = {
  scene: string;
  visual: string;
  camera: string;
  dialogue: string;
  imagePrompt: string;
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
