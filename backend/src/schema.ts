import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';

const typeDefs = `
  type PanelType {
    id: ID!
    name: String!
    manufacturer: String!
    efficiency: Float!
    wattage: Int!
    pricePerWatt: Float!
  }

  type Location {
    id: ID!
    city: String!
    country: String!
    latitude: Float!
    longitude: Float!
    avgSunHoursPerDay: Float!
  }

  type Simulation {
    id: ID!
    location: Location!
    panelType: PanelType!
    roofSizeM2: Float!
    estimatedOutput: Float!
    estimatedCost: Float!
    estimatedROI: Float!
    createdAt: String!
  }

  type Query {
    panelTypes: [PanelType!]!
    locations: [Location!]!
    simulations: [Simulation!]!
  }

  input CreateSimulationInput {
    locationId: ID!
    panelTypeId: ID!
    roofSizeM2: Float!
  }

  type Mutation {
    createSimulation(input: CreateSimulationInput!): Simulation!
  }
`;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});