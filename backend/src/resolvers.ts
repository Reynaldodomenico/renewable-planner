import { PrismaClient } from '@prisma/client';
import { z } from "zod";

const prisma = new PrismaClient();
const RUST_SIMULATOR_URL = process.env.RUST_SIMULATOR_URL || 'http://rust-simulator:8080';

const RustSimulationSchema = z.object({
  estimated_output_kwh: z.number(),
  estimated_cost_usd: z.number(),
  estimated_roi_years: z.number(),
});

export type RustSimulationResult = z.infer<typeof RustSimulationSchema>;

const CreateSimulationInputSchema = z.object({
  locationId: z.string().uuid(),
  panelTypeId: z.string().uuid(),
  roofSizeM2: z.number().positive().min(1),
});

export type CreateSimulationInput = z.infer<typeof CreateSimulationInputSchema>;

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
      const parsedInput = CreateSimulationInputSchema.parse(input);
      
      const { locationId, panelTypeId, roofSizeM2 } = parsedInput;

      const location = await prisma.location.findUnique({ where: { id: locationId } });
      const panel = await prisma.panelType.findUnique({ where: { id: panelTypeId } });

      if (!location || !panel) {
        throw new Error('Location or Panel not found');
      }

      console.log('Calling Rust simulator...');
      const rustResponse = await fetch(`${RUST_SIMULATOR_URL}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          avg_sun_hours_per_day: location.avgSunHoursPerDay,
          roof_size_m2: roofSizeM2,
          panel_efficiency: panel.efficiency,
          panel_wattage: panel.wattage,
          price_per_watt: panel.pricePerWatt,
        }),
      });

      if (!rustResponse.ok) {
        const error = await rustResponse.text();
        throw new Error(`Rust simulator error: ${error}`);
      }

      const json = await rustResponse.json();
      const rustResult = RustSimulationSchema.parse(json);

      console.log('Rust calculation complete!');

      const simulation = await prisma.simulation.create({
        data: {
          locationId,
          panelTypeId,
          roofSizeM2,
          estimatedOutput: rustResult.estimated_output_kwh,
          estimatedCost: rustResult.estimated_cost_usd,
          estimatedROI: rustResult.estimated_roi_years,
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