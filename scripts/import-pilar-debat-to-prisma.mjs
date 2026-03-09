import { PrismaClient } from '@prisma/client';
import { buildPilarDebatStoryData } from './story-data.mjs';

const prisma = new PrismaClient();

function asDate(value) {
  return value ? new Date(value) : new Date();
}

async function main() {
  const timestamp = new Date().toISOString();
  const storyData = buildPilarDebatStoryData(timestamp);
  const storyId = storyData.stories[0]?.id;
  if (!storyId) {
    throw new Error('No story payload found');
  }

  const characterIds = storyData.characters.map((character) => character.id);

  await prisma.$transaction(async (tx) => {
    for (const musicTrack of storyData.musicTracks) {
      await tx.musicTrack.upsert({
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

    for (const background of storyData.backgrounds) {
      await tx.background.upsert({
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

    for (const character of storyData.characters) {
      await tx.character.upsert({
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

    await tx.characterSprite.deleteMany({
      where: {
        characterId: {
          in: characterIds,
        },
      },
    });

    if (storyData.characterSprites.length > 0) {
      await tx.characterSprite.createMany({
        data: storyData.characterSprites.map((sprite) => ({
          id: sprite.id,
          characterId: sprite.characterId,
          label: sprite.label,
          imageUrl: sprite.imageUrl,
          isDefault: Boolean(sprite.isDefault),
          sortOrder: Number(sprite.sortOrder ?? 0),
          createdAt: asDate(sprite.createdAt),
          updatedAt: asDate(sprite.updatedAt),
        })),
      });
    }

    const story = storyData.stories[0];
    await tx.story.upsert({
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

    const existingNodes = await tx.node.findMany({
      where: { storyId },
      select: { id: true },
    });
    const existingNodeIds = existingNodes.map((node) => node.id);

    if (existingNodeIds.length > 0) {
      await tx.choice.deleteMany({
        where: {
          OR: [
            {
              nodeId: {
                in: existingNodeIds,
              },
            },
            {
              targetNodeId: {
                in: existingNodeIds,
              },
            },
          ],
        },
      });

      await tx.node.deleteMany({
        where: { storyId },
      });
    }

    if (storyData.nodes.length > 0) {
      await tx.node.createMany({
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
    }

    if (storyData.choices.length > 0) {
      await tx.choice.createMany({
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
    }
  });

  console.log(
    JSON.stringify(
      {
        imported: {
          storyId,
          title: storyData.stories[0].title,
          characters: storyData.characters.length,
          characterSprites: storyData.characterSprites.length,
          backgrounds: storyData.backgrounds.length,
          musicTracks: storyData.musicTracks.length,
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
