import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dataFile = path.join(process.cwd(), 'data', 'db.json');

function asDate(value) {
  return value ? new Date(value) : new Date();
}

async function main() {
  const raw = await readFile(dataFile, 'utf8');
  const db = JSON.parse(raw);

  const stories = Array.isArray(db.stories) ? db.stories : [];
  const characters = Array.isArray(db.characters) ? db.characters : [];
  const characterSprites = Array.isArray(db.characterSprites) ? db.characterSprites : [];
  const backgrounds = Array.isArray(db.backgrounds) ? db.backgrounds : [];
  const nodes = Array.isArray(db.nodes) ? db.nodes : [];
  const choices = Array.isArray(db.choices) ? db.choices : [];
  const playerScores = Array.isArray(db.playerScores) ? db.playerScores : [];
  const publicLocale = db.siteSettings?.publicLocale === 'en' ? 'en' : 'id';

  await prisma.$transaction(async (tx) => {
    await tx.choice.deleteMany();
    await tx.node.deleteMany();
    await tx.characterSprite.deleteMany();
    await tx.background.deleteMany();
    await tx.character.deleteMany();
    await tx.playerScore.deleteMany();
    await tx.story.deleteMany();
    await tx.siteSettings.deleteMany();

    if (stories.length > 0) {
      await tx.story.createMany({
        data: stories.map((story) => ({
          id: story.id,
          title: story.title,
          description: story.description ?? null,
          createdAt: asDate(story.createdAt),
          updatedAt: asDate(story.updatedAt),
        })),
      });
    }

    if (characters.length > 0) {
      await tx.character.createMany({
        data: characters.map((character) => ({
          id: character.id,
          name: character.name,
          createdAt: asDate(character.createdAt),
          updatedAt: asDate(character.updatedAt),
        })),
      });
    }

    if (characterSprites.length > 0) {
      await tx.characterSprite.createMany({
        data: characterSprites.map((sprite) => ({
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

    if (backgrounds.length > 0) {
      await tx.background.createMany({
        data: backgrounds.map((background) => ({
          id: background.id,
          name: background.name,
          imageUrl: background.imageUrl,
          createdAt: asDate(background.createdAt),
          updatedAt: asDate(background.updatedAt),
        })),
      });
    }

    await tx.siteSettings.create({
      data: {
        id: 'global',
        publicLocale,
      },
    });

    if (nodes.length > 0) {
      await tx.node.createMany({
        data: nodes.map((node) => ({
          id: node.id,
          storyId: node.storyId,
          characterId: node.characterId ?? null,
          characterSpriteId: node.characterSpriteId ?? null,
          backgroundId: node.backgroundId ?? null,
          editorDepth: Number(node.editorDepth ?? 0),
          editorOrder: Number(node.editorOrder ?? 0),
          text: node.text,
          audioUrl: node.audioUrl ?? null,
          isStartNode: Boolean(node.isStartNode),
          isEndNode: Boolean(node.isEndNode),
          createdAt: asDate(node.createdAt),
          updatedAt: asDate(node.updatedAt),
        })),
      });
    }

    if (choices.length > 0) {
      await tx.choice.createMany({
        data: choices.map((choice) => ({
          id: choice.id,
          nodeId: choice.nodeId,
          targetNodeId: choice.targetNodeId ?? null,
          text: choice.text,
          scoreImpact: Number(choice.scoreImpact ?? 0),
          createdAt: asDate(choice.createdAt),
          updatedAt: asDate(choice.updatedAt),
        })),
      });
    }

    if (playerScores.length > 0) {
      await tx.playerScore.createMany({
        data: playerScores.map((score) => ({
          id: score.id,
          name: score.name,
          score: Number(score.score ?? 0),
          createdAt: asDate(score.createdAt),
        })),
      });
    }
  });

  console.log(
    JSON.stringify(
      {
        imported: {
          stories: stories.length,
          characters: characters.length,
          characterSprites: characterSprites.length,
          backgrounds: backgrounds.length,
          nodes: nodes.length,
          choices: choices.length,
          playerScores: playerScores.length,
          publicLocale,
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
