import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if data already exists
  const existingPanels = await prisma.panelType.count();
  
  if (existingPanels > 0) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database...');

  // Seed panel types
  await prisma.panelType.createMany({
    data: [
      {
        name: 'SunPower Maxeon 6',
        manufacturer: 'SunPower',
        efficiency: 22.8,
        wattage: 430,
        pricePerWatt: 3.50,
      },
      {
        name: 'LG NeON R',
        manufacturer: 'LG',
        efficiency: 22.0,
        wattage: 380,
        pricePerWatt: 3.20,
      },
      {
        name: 'Canadian Solar HiKu6',
        manufacturer: 'Canadian Solar',
        efficiency: 21.2,
        wattage: 405,
        pricePerWatt: 2.80,
      },
      {
        name: 'Jinko Tiger Neo',
        manufacturer: 'Jinko Solar',
        efficiency: 21.8,
        wattage: 415,
        pricePerWatt: 2.90,
      },
    ],
  });

  // Seed locations
  await prisma.location.createMany({
    data: [
      {
        city: 'Los Angeles',
        country: 'USA',
        latitude: 34.0522,
        longitude: -118.2437,
        avgSunHoursPerDay: 5.6,
      },
      {
        city: 'Phoenix',
        country: 'USA',
        latitude: 33.4484,
        longitude: -112.0740,
        avgSunHoursPerDay: 6.5,
      },
      {
        city: 'Berlin',
        country: 'Germany',
        latitude: 52.5200,
        longitude: 13.4050,
        avgSunHoursPerDay: 3.8,
      },
      {
        city: 'Sydney',
        country: 'Australia',
        latitude: -33.8688,
        longitude: 151.2093,
        avgSunHoursPerDay: 5.9,
      },
    ],
  });

  const panels = await prisma.panelType.count();
  const locations = await prisma.location.count();

  console.log('✅ Seeded:', { panels, locations });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });