import { db, setActiveDriverForTests } from '../src/prisma/db';

setActiveDriverForTests('memory');

async function seedDemoData() {
  const existing = await db.aptitudeTopic.findUnique({ where: { id: 'q1' } });
  if (!existing) {
    await db.aptitudeTopic.create({
      data: {
        id: 'q1',
        name: 'Time and Work',
        category: 'QUANTITATIVE',
        description: 'Calculate rate efficiency and pipeline cistern parameters.'
      }
    });
  }
}

seedDemoData();
