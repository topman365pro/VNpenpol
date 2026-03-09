import { PrismaClient } from '@prisma/client';
import { buildPilarDebatStoryData } from './story-data.mjs';
import { buildPilarLongStoryData } from './pilar-long-story.mjs';

const prisma = new PrismaClient();

function asDate(value) {
  return value ? new Date(value) : new Date();
}

async function main() {
  const timestamp = new Date().toISOString();
  const sharedData = buildPilarDebatStoryData(timestamp);
  const storyData = buildPilarLongStoryData(timestamp);
  const storyId = storyData.stories[0]?.id;

  if (!storyId) {
    throw new Error('No story payload found');
  }

  for (const musicTrack of sharedData.musicTracks) {
    await prisma.musicTrack.upsert({
      where: { id: musicTrack.id },
      update: {
        name: musicTrack.name,
        audioUrl: musicTrack.audioUrl,
        updatedAt: asDate(musicTrack.updatedAt),
      },
      create: {
        id: musicTrack.id,
        name: musicTrack.name,
        audioUrl: musicTrack.audioUrl,
        createdAt: asDate(musicTrack.createdAt),
        updatedAt: asDate(musicTrack.updatedAt),
      },
    });
  }

  for (const background of sharedData.backgrounds) {
    await prisma.background.upsert({
      where: { id: background.id },
      update: {
        name: background.name,
        imageUrl: background.imageUrl,
        updatedAt: asDate(background.updatedAt),
      },
      create: {
        id: background.id,
        name: background.name,
        imageUrl: background.imageUrl,
        createdAt: asDate(background.createdAt),
        updatedAt: asDate(background.updatedAt),
      },
    });
  }

  for (const character of sharedData.characters) {
    await prisma.character.upsert({
      where: { id: character.id },
      update: {
        name: character.name,
        updatedAt: asDate(character.updatedAt),
      },
      create: {
        id: character.id,
        name: character.name,
        createdAt: asDate(character.createdAt),
        updatedAt: asDate(character.updatedAt),
      },
    });
  }

  for (const sprite of sharedData.characterSprites) {
    await prisma.characterSprite.upsert({
      where: { id: sprite.id },
      update: {
        characterId: sprite.characterId,
        label: sprite.label,
        imageUrl: sprite.imageUrl,
        isDefault: Boolean(sprite.isDefault),
        sortOrder: Number(sprite.sortOrder ?? 0),
        updatedAt: asDate(sprite.updatedAt),
      },
      create: {
        id: sprite.id,
        characterId: sprite.characterId,
        label: sprite.label,
        imageUrl: sprite.imageUrl,
        isDefault: Boolean(sprite.isDefault),
        sortOrder: Number(sprite.sortOrder ?? 0),
        createdAt: asDate(sprite.createdAt),
        updatedAt: asDate(sprite.updatedAt),
      },
    });
  }

  const story = storyData.stories[0];
  await prisma.story.upsert({
    where: { id: story.id },
    update: {
      title: story.title,
      description: story.description ?? null,
      defaultMusicTrackId: story.defaultMusicTrackId ?? null,
      updatedAt: asDate(story.updatedAt),
    },
    create: {
      id: story.id,
      title: story.title,
      description: story.description ?? null,
      defaultMusicTrackId: story.defaultMusicTrackId ?? null,
      createdAt: asDate(story.createdAt),
      updatedAt: asDate(story.updatedAt),
    },
  });

  const existingNodes = await prisma.node.findMany({
    where: { storyId },
    select: { id: true },
  });
  const existingNodeIds = existingNodes.map((record) => record.id);

  if (existingNodeIds.length > 0) {
    await prisma.choice.deleteMany({
      where: {
        OR: [
          { nodeId: { in: existingNodeIds } },
          { targetNodeId: { in: existingNodeIds } },
        ],
      },
    });

    await prisma.node.deleteMany({
      where: { storyId },
    });
  }

  await prisma.node.createMany({
    data: storyData.nodes.map((storyNode) => ({
      id: storyNode.id,
      storyId: storyNode.storyId,
      characterId: storyNode.characterId ?? null,
      characterSpriteId: storyNode.characterSpriteId ?? null,
      backgroundId: storyNode.backgroundId ?? null,
      musicTrackId: storyNode.musicTrackId ?? null,
      editorDepth: Number(storyNode.editorDepth ?? 0),
      editorOrder: Number(storyNode.editorOrder ?? 0),
      text: storyNode.text,
      audioUrl: storyNode.audioUrl ?? null,
      isStartNode: Boolean(storyNode.isStartNode),
      isEndNode: Boolean(storyNode.isEndNode),
      createdAt: asDate(storyNode.createdAt),
      updatedAt: asDate(storyNode.updatedAt),
    })),
  });

  await prisma.choice.createMany({
    data: storyData.choices.map((storyChoice) => ({
      id: storyChoice.id,
      nodeId: storyChoice.nodeId,
      targetNodeId: storyChoice.targetNodeId ?? null,
      text: storyChoice.text,
      scoreImpact: Number(storyChoice.scoreImpact ?? 0),
      createdAt: asDate(storyChoice.createdAt),
      updatedAt: asDate(storyChoice.updatedAt),
    })),
  });

  console.log(
    JSON.stringify(
      {
        imported: {
          storyId,
          title: storyData.stories[0].title,
          sharedCharacters: sharedData.characters.length,
          sharedCharacterSprites: sharedData.characterSprites.length,
          sharedBackgrounds: sharedData.backgrounds.length,
          sharedMusicTracks: sharedData.musicTracks.length,
          nodes: storyData.nodes.length,
          choices: storyData.choices.length,
          mode: 'additive-upsert',
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
