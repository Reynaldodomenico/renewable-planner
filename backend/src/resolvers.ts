import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    panelTypes: async () => {
      return await prisma.panelType.findMany();
    },
    locations: async () => {
      return await prisma.location.findMany();
    },
    simulations: async () => {
      return await prisma.simulation.findMany({
        include: {
          location: true,
          panelType: true,
        },
      });
    },
  },
  Mutation: {
    createSimulation: async (_: any, { input }: any) => {
      const { locationId, panelTypeId, roofSizeM2 } = input;

      const location = await prisma.location.findUnique({ where: { id: locationId } });
      const panel = await prisma.panelType.findUnique({ where: { id: panelTypeId } });

      if (!location || !panel) {
        throw new Error('Location or Panel not found');
      }

      const panelArea = 1.7;
      const numPanels = Math.floor(roofSizeM2 / panelArea);
      const systemSizeKW = (numPanels * panel.wattage) / 1000;
      const estimatedOutput = systemSizeKW * location.avgSunHoursPerDay * 365;
      const estimatedCost = systemSizeKW * 1000 * panel.pricePerWatt;
      const estimatedROI = estimatedCost / (estimatedOutput * 0.15);

      const simulation = await prisma.simulation.create({
        data: {
          locationId,
          panelTypeId,
          roofSizeM2,
          estimatedOutput,
          estimatedCost,
          estimatedROI,
        },
        include: {
          location: true,
          panelType: true,
        },
      });

      return simulation;
    },
  },
};